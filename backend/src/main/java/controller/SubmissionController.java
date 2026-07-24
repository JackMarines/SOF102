package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import dao.ProgressDao;
import dao.TestcaseDao;
import entity.Testcase;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.Judge0Util;
import util.ResponseUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.*;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@WebServlet("/api/v1/submit")
public class SubmissionController extends HttpServlet {

    private TestcaseDao testcaseDao = new TestcaseDao();
    private ProgressDao progressDao = new ProgressDao();
    private ObjectMapper objectMapper = new ObjectMapper();
    private static final Map<Integer, String> TEMPLATES = new HashMap<>();
    private static final Map<Integer, Long> LAST_SUBMIT = new ConcurrentHashMap<>();
    private static final int RATE_LIMIT_MS = 2000;
    private static final Logger logger = LoggerFactory.getLogger(SubmissionController.class);
    private static final int MAX_RETRIES = 60;
    private static final long RETRY_DELAY_MS = 500;

    private static final Map<Integer, Integer> JUDGE0_LANG_MAP = Map.of(
        1, 71,
        2, 63,
        3, 68
    );

    @Override
    public void init() throws ServletException {
        loadTemplate(71, "templates/71.txt");
        loadTemplate(63, "templates/63.txt");
        loadTemplate(68, "templates/68.txt");
    }

    private void loadTemplate(int judge0Lang, String path) throws ServletException {
        try {
            String content = new String(
                getClass().getClassLoader().getResourceAsStream(path).readAllBytes());
            TEMPLATES.put(judge0Lang, content);
        } catch (Exception e) {
            throw new ServletException("Failed to load template: " + path, e);
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        User user = (User) req.getSession().getAttribute("user");
        if (user == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }

        int userId = user.getUserId();

        // Rate limit
        long now = System.currentTimeMillis();
        Long last = LAST_SUBMIT.get(userId);
        if (last != null && (now - last) < RATE_LIMIT_MS) {
            logger.warn("Rate limit hit: userId={}", userId);
            ResponseUtil.error(resp, 429, "Please wait before submitting again");
            return;
        }
        LAST_SUBMIT.put(userId, now);

        Map<String, Object> body = readJsonBody(req);
        int puzId = Integer.parseInt(body.get("puz_id").toString());
        int langId = Integer.parseInt(body.get("lang_id").toString());
        String userCode = (String) body.get("user_code");
        String funcName = (String) body.get("function_name");
        Integer progTime = body.get("prog_time") != null
            ? Integer.parseInt(body.get("prog_time").toString()) : null;
        String progCode = (String) body.get("prog_code");

        int judge0Lang = JUDGE0_LANG_MAP.getOrDefault(langId, 71);

        // Validate source code length
        if (userCode == null || userCode.length() > 100_000) {
            ResponseUtil.error(resp, 400, "Source code too large (max 100KB)");
            return;
        }

        List<Testcase> testcases = testcaseDao.getTestcasesByPuzzleId(puzId);
        if (testcases.isEmpty()) {
            ResponseUtil.error(resp, 404, "No test cases found for this puzzle");
            return;
        }

        String template = TEMPLATES.get(judge0Lang);
        if (template == null) {
            ResponseUtil.error(resp, 400, "Language not supported");
            return;
        }

        String wrapper = template.replace("{FUNCT}", funcName);
        String fullCode = userCode + "\n" + wrapper;
        String encodedCode = Judge0Util.base64Encode(fullCode);

        // Build batch submissions
        List<Map<String, Object>> submissions = new ArrayList<>();
        for (Testcase tc : testcases) {
            Map<String, Object> sub = new HashMap<>();
            sub.put("source_code",      encodedCode);
            sub.put("language_id",      judge0Lang);
            sub.put("stdin",            Judge0Util.base64Encode(tc.getTcInput()));
            sub.put("expected_output",  Judge0Util.base64Encode(tc.getTcOutput()));
            submissions.add(sub);
        }

        // Submit batch to Judge0
        List<Map<String, Object>> tokens;
        try {
            tokens = Judge0Util.callJudge0(submissions);
            logger.info("Judge0 submitted: userId={}, puzId={}, testcases={}",
                userId, puzId, submissions.size());
        } catch (Exception e) {
            LAST_SUBMIT.remove(userId);
            logger.error("Judge0 submission failed: userId={}, error={}", userId, e.getMessage());
            ResponseUtil.error(resp, 500, "Judge0 submission failed: " + e.getMessage());
            return;
        }

        // Map token -> testcase
        Map<String, Testcase> tokenToTestcase = new HashMap<>();
        for (int i = 0; i < tokens.size(); i++) {
            tokenToTestcase.put((String) tokens.get(i).get("token"), testcases.get(i));
        }

        String tokenStr = tokens.stream()
            .map(t -> (String) t.get("token"))
            .collect(Collectors.joining(","));

        // Poll for results
        Map<String, Object> result;
        int retries = 0;
        try {
            do {
                Thread.sleep(RETRY_DELAY_MS);
                result = Judge0Util.getJudge0(tokenStr);
                if (++retries >= MAX_RETRIES) {
                    LAST_SUBMIT.remove(userId);
                    logger.error("Judge0 polling timed out: userId={}, retries={}", userId, retries);
                    ResponseUtil.error(resp, 504, "Judge0 timed out after "
                        + (MAX_RETRIES * RETRY_DELAY_MS / 1000) + "s");
                    return;
                }
            } while (isProcessing(result));
            logger.info("Judge0 poll done: userId={}, retries={}, elapsed={}ms",
                userId, retries, retries * RETRY_DELAY_MS);
        } catch (Exception e) {
            LAST_SUBMIT.remove(userId);
            logger.error("Judge0 polling failed: userId={}, error={}", userId, e.getMessage());
            ResponseUtil.error(resp, 500, "Judge0 polling failed: " + e.getMessage());
            return;
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> subs =
            (List<Map<String, Object>>) result.get("submissions");

        // Parse results
        boolean error = false;
        String errorMsg = "";
        int passed = 0;
        List<Map<String, Object>> failed = new ArrayList<>();
        List<Map<String, Object>> testcaseResults = new ArrayList<>();
        String compileOutput = "";
        String globalStderr = "";
        double maxTime = 0;
        long maxMemory = 0;
        int testIdx = 0;

        for (Map<String, Object> r : subs) {
            String token = (String) r.get("token");
            Testcase tc = tokenToTestcase.get(token);
            if (tc == null) continue;
            testIdx++;

            @SuppressWarnings("unchecked")
            Map<String, Object> status = (Map<String, Object>) r.get("status");
            int statusId = (int) status.get("id");
            String statusDesc = (String) status.get("description");

            String thisStderr = Judge0Util.base64Decode((String) r.get("stderr"));
            String thisCompile = Judge0Util.base64Decode((String) r.get("compile_output"));

            Map<String, Object> tr = new HashMap<>();
            tr.put("index", testIdx);
            tr.put("status", statusDesc);
            tr.put("time", r.get("time"));
            tr.put("memory", r.get("memory"));

            // Compile error — stop immediately
            if (statusId == 6) {
                tr.put("passed", false);
                testcaseResults.add(tr);
                error = true;
                compileOutput = !thisCompile.isEmpty() ? thisCompile : "Compile error";
                errorMsg = compileOutput;
                logger.warn("Compile error: userId={}, puzId={}", userId, puzId);
                break;
            }

            // Wrong Answer — add to failed list with actual stdout
            if (statusId == 4) {
                String stdout = Judge0Util.base64Decode((String) r.get("stdout")).trim();
                String expected = tc.getTcOutput().trim();

                if (r.get("time") != null) {
                    double t = Double.parseDouble((String) r.get("time"));
                    if (t > maxTime) maxTime = t;
                }
                if (r.get("memory") != null) {
                    long m = ((Number) r.get("memory")).longValue();
                    if (m > maxMemory) maxMemory = m;
                }

                tr.put("passed", false);
                testcaseResults.add(tr);

                Map<String, Object> f = new HashMap<>();
                f.put("input",    tc.getTcInput());
                f.put("expected", expected);
                f.put("got",      stdout);
                f.put("time",     r.get("time"));
                f.put("memory",   r.get("memory"));
                f.put("stderr",   thisStderr);
                f.put("status",   statusDesc);
                failed.add(f);
                continue;
            }

            // Other non-Accepted (TLE, Runtime error, etc.)
            if (statusId != 3) {
                tr.put("passed", false);
                testcaseResults.add(tr);
                if (!error) {
                    error = true;
                    errorMsg = statusDesc;
                }
                globalStderr = thisStderr;
                continue;
            }

            // Accepted — compare stdout vs expected
            String stdout = Judge0Util.base64Decode((String) r.get("stdout")).trim();
            String expected = tc.getTcOutput().trim();

            if (r.get("time") != null) {
                double t = Double.parseDouble((String) r.get("time"));
                if (t > maxTime) maxTime = t;
            }
            if (r.get("memory") != null) {
                long m = ((Number) r.get("memory")).longValue();
                if (m > maxMemory) maxMemory = m;
            }

            boolean thisPassed = stdout.equals(expected);
            tr.put("passed", thisPassed);
            testcaseResults.add(tr);

            if (thisPassed) {
                passed++;
            } else {
                Map<String, Object> f = new HashMap<>();
                f.put("input", tc.getTcInput());
                f.put("expected", expected);
                f.put("got", stdout);
                f.put("time", r.get("time"));
                f.put("memory", r.get("memory"));
                f.put("stderr", thisStderr);
                f.put("status", statusDesc);
                failed.add(f);
            }
        }

        boolean puzzlePass = failed.isEmpty() && !error;
        if (puzzlePass) {
            progressDao.upsert(user.getUserId(), puzId, progTime, progCode);
            logger.info("Puzzle passed: userId={}, puzId={}, passed={}/{}",
                userId, puzId, passed, testcases.size());
        } else {
            logger.info("Puzzle failed: userId={}, puzId={}, passed={}/{}, errors={}",
                userId, puzId, passed, testcases.size(), failed.size());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("testcount",    testcases.size());
        response.put("testpassed",   passed);
        response.put("testfailed",   failed);
        response.put("testcases",    testcaseResults);
        response.put("puzzlepass",   puzzlePass);
        response.put("error",        error);
        response.put("errorMsg",     errorMsg);
        response.put("compile_output", compileOutput);
        response.put("stderr",       globalStderr);
        response.put("time",         maxTime);
        response.put("memory",       maxMemory);

        ResponseUtil.success(resp, response);
    }

    private boolean isProcessing(Map<String, Object> result) {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> subs =
            (List<Map<String, Object>>) result.get("submissions");
        if (subs == null || subs.isEmpty()) return true;
        for (Map<String, Object> sub : subs) {
            @SuppressWarnings("unchecked")
            Map<String, Object> status = (Map<String, Object>) sub.get("status");
            int id = (int) status.get("id");
            if (id == 1 || id == 2) return true;
        }
        return false;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJsonBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        if (sb.length() == 0) return new HashMap<>();
        return objectMapper.readValue(sb.toString(), Map.class);
    }
}
