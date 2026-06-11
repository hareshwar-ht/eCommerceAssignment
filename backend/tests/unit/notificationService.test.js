const notificationService = require("../../src/services/notificationService");
const notificationModel = require("../../src/models/notificationModel");
const rabbitmq = require("../../src/config/rabbitmq");

jest.mock("../../src/models/notificationModel");
jest.mock("../../src/config/rabbitmq");
jest.mock("../../src/services/emailService");
jest.mock("../../src/services/smsService");

describe("Notification Service", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("queueNotification", () => {
    it("should queue an email notification successfully", async () => {
      const template = {
        id: "uuid",
        template_id: "sg-temp-id",
        name: "welcome",
      };
      const history = { id: "hist-id" };

      notificationModel.findByName.mockResolvedValue(template);
      notificationModel.createHistory.mockResolvedValue(history);
      rabbitmq.publish.mockResolvedValue(true);

      const result = await notificationService.queueNotification({
        type: "email",
        userId: "user-id",
        recipient: "test@example.com",
        templateName: "welcome",
        payload: { name: "Test" },
      });

      expect(result).toEqual(history);
      expect(rabbitmq.publish).toHaveBeenCalledWith(
        rabbitmq.QUEUES.EMAIL,
        expect.objectContaining({
          type: "email",
          recipient: "test@example.com",
          templateId: "sg-temp-id",
        }),
      );
    });

    it("should throw an error if template is not found", async () => {
      notificationModel.findByName.mockResolvedValue(null);

      await expect(
        notificationService.queueNotification({
          type: "email",
          userId: "user-id",
          recipient: "test@example.com",
          templateName: "unknown",
          payload: {},
        }),
      ).rejects.toThrow("Template not found: unknown");
    });
  });
});
