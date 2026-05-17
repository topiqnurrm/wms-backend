const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map((d) => ({
          field: d.path[0],
          message: d.message.replace(/['"]/g, ''),
        })),
      });
    }
    next();
  };
};

module.exports = validate;