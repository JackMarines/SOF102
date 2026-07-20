// Kiểm tra quyền admin — nếu không phải admin thì chuyển hướng về trang chủ
async function checkAdminAuth() {
    // Ẩn body trước khi xác thực (tránh flash nội dung)
    document.body.style.display = 'none';
    try {
        var session = await getMe();
        // Nếu chưa đăng nhập hoặc không phải admin → chuyển về home
        if (session.error || !session.userIsadmin) {
            window.location.href = '/frontend/pages/user/home/index.html';
            return null;
        }
        // Xác thực thành công → hiện body
        document.body.style.display = '';
        return session;
    } catch (e) {
        window.location.href = '/frontend/pages/user/home/index.html';
        return null;
    }
}
