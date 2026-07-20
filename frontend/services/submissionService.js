// Submission service — API wrapper cho gửi code submit
// Tất cả DOM building (timer, test case results) đã được chuyển sang user/solve/solve.js

async function submitCode(body) {
    return apiPost('/submit', body);
}
