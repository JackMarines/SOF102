// Controller công khai lấy announcements chưa hết hạn
package controller;

import dao.AnnouncementDao;
import entity.Announcement;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import util.ResponseUtil;

import java.io.IOException;
import java.util.*;

@WebServlet("/api/v1/announcements")
public class PublicAnnouncementController extends HttpServlet {

    private AnnouncementDao announcementDao = new AnnouncementDao();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        List<Announcement> list = announcementDao.findActive();
        List<Map<String, Object>> dataList = new ArrayList<>();
        for (Announcement a : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", a.getAnnId());
            item.put("title", a.getAnnTitle());
            item.put("content", a.getAnnContent());
            item.put("authorId", a.getAnnAuthorid());
            item.put("createdAt", a.getAnnCreatedat());
            item.put("updatedAt", a.getAnnUpdatedat());
            item.put("isPinned", a.getAnnIspinned());
            item.put("isPublished", a.getAnnIspublished());
            item.put("type", a.getAnnType());
            dataList.add(item);
        }
        ResponseUtil.success(resp, Map.of("data", dataList));
    }
}
