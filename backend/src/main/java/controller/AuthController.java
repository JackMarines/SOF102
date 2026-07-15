// Controller xử lý đăng nhập, đăng ký, đăng xuất
package controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.firebase.auth.FirebaseToken;
import dao.UserDao;
import entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import service.FirebaseService;
import util.ResponseUtil;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet({
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/logout",
    "/api/v1/auth/me"
})
public class AuthController extends HttpServlet {

    private UserDao userDao = new UserDao();
    private ObjectMapper objectMapper = new ObjectMapper();
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    @Override
    public void init() throws ServletException {
        FirebaseService.init();
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        String uri = req.getRequestURI();

        if (uri.contains("/login")) {
            doLogin(req, resp);
        } else if (uri.contains("/register")) {
            doRegister(req, resp);
        } else if (uri.contains("/logout")) {
            doLogout(req, resp);
        } else if (uri.contains("/me")) {
            doMe(req, resp);
        }
    }

    // Đọc body JSON từ request
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

    // Xác thực Firebase token -> tìm user trong CSDL -> tạo session
    // Nếu request có kèm "username" thì tìm user bằng username (đăng nhập bằng username)
    // Nếu không có username thì tìm bằng firebaseUid (đăng nhập bằng email)
    private void doLogin(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> json = readJsonBody(req);
        String idToken = (String) json.get("idToken");
        String username = (String) json.get("username");

        if (idToken == null || idToken.isEmpty()) {
            ResponseUtil.error(resp, 400, "idToken is required");
            return;
        }

        FirebaseToken decoded = FirebaseService.verifyToken(idToken);
        if (decoded == null) {
            ResponseUtil.error(resp, 401, "Invalid Firebase token");
            return;
        }

        String firebaseUid = decoded.getUid();

        User user;
        if (username != null && !username.trim().isEmpty()) {
            user = userDao.findByUsername(username.trim());
        } else {
            user = userDao.findByFirebaseUid(firebaseUid);
        }
        if (user == null) {
            ResponseUtil.error(resp, 404, "User not found. Please register first.");
            return;
        }

        // Chống session fixation: tạo session ID mới trước khi set attribute
        req.changeSessionId();
        req.getSession().setAttribute("user", user);

        logger.info("User logged in: userId={}, email={}", user.getUserId(), user.getUserEmail());

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getUserId());
        data.put("userName", user.getUserName());
        data.put("userEmail", user.getUserEmail());
        data.put("userIsadmin", user.getUserIsadmin());
        data.put("teamId", user.getTeam() != null ? user.getTeam().getTeamId() : null);

        ResponseUtil.success(resp, data);
    }

    // Xác thực Firebase token -> tạo user mới trong CSDL -> tạo session
    private void doRegister(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Map<String, Object> json = readJsonBody(req);
        String idToken = (String) json.get("idToken");
        String username = (String) json.get("username");

        if (idToken == null || idToken.isEmpty()) {
            ResponseUtil.error(resp, 400, "idToken is required");
            return;
        }
        if (username == null || username.trim().isEmpty()) {
            ResponseUtil.error(resp, 400, "username is required");
            return;
        }

        FirebaseToken decoded = FirebaseService.verifyToken(idToken);
        if (decoded == null) {
            ResponseUtil.error(resp, 401, "Invalid Firebase token");
            return;
        }

        String firebaseUid = decoded.getUid();
        String email = decoded.getEmail();

        if (userDao.findByFirebaseUid(firebaseUid) != null) {
            ResponseUtil.error(resp, 409, "User already exists");
            return;
        }
        if (userDao.findByUsername(username) != null) {
            ResponseUtil.error(resp, 409, "Username already taken");
            return;
        }

        User user = new User();
        user.setUserEmail(email);
        user.setUserName(username.trim());
        user.setUserFirebaseuid(firebaseUid);
        user.setUserIsadmin(false);

        userDao.create(user);

        // Chống session fixation: tạo session ID mới trước khi set attribute
        req.changeSessionId();
        req.getSession().setAttribute("user", user);

        logger.info("User registered: userId={}, username={}", user.getUserId(), username);

        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getUserId());
        data.put("userName", user.getUserName());
        data.put("userEmail", user.getUserEmail());
        data.put("userIsadmin", user.getUserIsadmin());

        ResponseUtil.success(resp, data);
    }

    // Xóa session -> đăng xuất
    private void doLogout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = (User) req.getSession().getAttribute("user");
        if (user != null) {
            logger.info("User logged out: userId={}", user.getUserId());
        }
        req.getSession().invalidate();
        Map<String, Object> data = new HashMap<>();
        data.put("message", "Logged out");
        ResponseUtil.success(resp, data);
    }

    // Lấy thông tin user từ session hiện tại
    private void doMe(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        User user = (User) req.getSession().getAttribute("user");
        if (user == null) {
            ResponseUtil.error(resp, 401, "Not authenticated");
            return;
        }
        Map<String, Object> data = new HashMap<>();
        data.put("userId", user.getUserId());
        data.put("userName", user.getUserName());
        data.put("userEmail", user.getUserEmail());
        data.put("userIsadmin", user.getUserIsadmin());
        data.put("teamId", user.getTeam() != null ? user.getTeam().getTeamId() : null);
        ResponseUtil.success(resp, data);
    }
}