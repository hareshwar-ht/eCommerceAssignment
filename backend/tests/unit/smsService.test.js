const twilio = require("twilio");

jest.mock("twilio", () => {
  const mockCreate = jest.fn();
  const mockClient = {
    messages: {
      create: mockCreate,
    },
  };
  const mockFactory = jest.fn().mockReturnValue(mockClient);
  mockFactory.mockCreate = mockCreate; // Attach mockCreate to the factory so it can be accessed in tests
  return mockFactory;
});

const { sendSMS } = require("../../src/services/smsService");

describe("SMS Service", () => {
  let mockCreate;

  beforeEach(() => {
    process.env.TWILIO_PHONE_NUMBER_FROM = "+1234567890";
    mockCreate = twilio.mockCreate;
    mockCreate.mockReset();
  });

  it("should format clean 10-digit numbers into Indian country code format and send successfully", async () => {
    mockCreate.mockResolvedValue({ sid: "sm-sid-123" });

    const result = await sendSMS({
      to: "9876543210",
      body: "Your OTP is 123456",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      body: "Your OTP is 123456",
      from: "+1234567890",
      to: "+919876543210",
    });
    expect(result).toEqual({ success: true, messageId: "sm-sid-123" });
  });

  it("should keep number prefix if starting with plus sign", async () => {
    mockCreate.mockResolvedValue({ sid: "sm-sid-123" });

    await sendSMS({
      to: "+19876543210",
      body: "Hello USA",
    });

    expect(mockCreate).toHaveBeenCalledWith({
      body: "Hello USA",
      from: "+1234567890",
      to: "+19876543210",
    });
  });

  it("should throw error if Twilio fails to send message", async () => {
    mockCreate.mockRejectedValue(new Error("Twilio Service Unavailable"));

    await expect(
      sendSMS({
        to: "+19876543210",
        body: "Failed Send",
      }),
    ).rejects.toThrow("Twilio Service Unavailable");
  });
});
