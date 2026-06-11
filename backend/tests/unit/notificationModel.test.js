const pool = require("../../src/config/database");
const notificationModel = require("../../src/models/notificationModel");

jest.mock("../../src/config/database", () => {
  return {
    query: jest.fn(),
  };
});

describe("Notification Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTemplate", () => {
    it("should insert a new notification template", async () => {
      const templateData = {
        name: "test-template",
        type: "email",
        templateId: "sg-id",
        subject: "Welcome",
        variables: ["name"],
      };
      pool.query.mockResolvedValue({ rows: [{ id: "template-uuid" }] });

      const result = await notificationModel.createTemplate(templateData);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO notification_templates"),
        [
          "test-template",
          "email",
          "sg-id",
          "Welcome",
          JSON.stringify(["name"]),
        ],
      );
      expect(result).toEqual({ id: "template-uuid" });
    });
  });

  describe("findByName", () => {
    it("should find active template by name", async () => {
      const mockTemplate = { id: "1", name: "welcome-email" };
      pool.query.mockResolvedValue({ rows: [mockTemplate] });

      const result = await notificationModel.findByName("welcome-email");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT * FROM notification_templates WHERE name =",
        ),
        ["welcome-email"],
      );
      expect(result).toEqual(mockTemplate);
    });

    it("should return null if not found", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await notificationModel.findByName("missing");
      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("should return joined notification history details", async () => {
      const mockRow = { id: "hist-123", external_template_id: "sg-123" };
      pool.query.mockResolvedValue({ rows: [mockRow] });

      const result = await notificationModel.findById("hist-123");
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "SELECT nh.*, nt.template_id as external_template_id",
        ),
        ["hist-123"],
      );
      expect(result).toEqual(mockRow);
    });
  });

  describe("createHistory", () => {
    it("should insert history record", async () => {
      pool.query.mockResolvedValue({ rows: [{ id: "history-123" }] });
      const result = await notificationModel.createHistory({
        userId: "user-123",
        type: "email",
        recipient: "test@example.com",
        templateId: "temp-123",
        payload: { name: "Alice" },
      });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO notification_history"),
        [
          "user-123",
          "email",
          "test@example.com",
          "temp-123",
          JSON.stringify({ name: "Alice" }),
        ],
      );
      expect(result).toEqual({ id: "history-123" });
    });
  });

  describe("updateHistoryStatus", () => {
    it("should update status and error details", async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await notificationModel.updateHistoryStatus(
        "hist-123",
        "failed",
        "SMTP Error",
      );
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE notification_history SET status ="),
        ["failed", "SMTP Error", "hist-123"],
      );
    });
  });

  describe("getHistory", () => {
    it("should retrieve list of logs and total count with default pagination", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ id: "1" }] }) // Select query
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }); // Count query

      const result = await notificationModel.getHistory({ page: 1, limit: 10 });
      expect(result.records).toEqual([{ id: "1" }]);
      expect(result.total).toBe(1);
    });

    it("should apply filters (userId, type, status)", async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      await notificationModel.getHistory({
        userId: "u-1",
        type: "email",
        status: "sent",
        page: 1,
        limit: 10,
      });
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining(
          "WHERE user_id = $1 AND type = $2 AND status = $3",
        ),
        ["u-1", "email", "sent", 10, 0],
      );
    });
  });

  describe("getAnalytics", () => {
    it("should fetch stats grouped by type", async () => {
      const mockStats = [{ type: "email", total: 5 }];
      pool.query.mockResolvedValue({ rows: mockStats });

      const result = await notificationModel.getAnalytics();
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("FROM notification_history"),
      );
      expect(result).toEqual(mockStats);
    });
  });
});
