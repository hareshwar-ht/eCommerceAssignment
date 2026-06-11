const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors
        ? err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          }))
        : [{ message: err.message }],
    });
  }
};

module.exports = { validate };
