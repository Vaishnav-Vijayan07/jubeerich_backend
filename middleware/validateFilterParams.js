const validateDateParams = (req, res, next) => {
  const { filterType, year, month, fromDate, toDate } = req.query;

  try {
    switch (filterType) {
      case "monthly":
        if (!year || !month) {
          return res.status(400).json({ error: "Year and month are required for monthly filter" });
        }
        if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
          return res.status(400).json({ error: "Invalid year or month" });
        }
        break;

      case "weekly":
        if (!year || !month || !fromDate) {
          return res.status(400).json({ error: "Year, month and week are required for week start date filter" });
        }
        break;

      case "custom":
        if (!fromDate || !toDate) {
          return res.status(400).json({ error: "From date and to date are required for custom filter" });
        }
        break;

      default:
        // Default to today if no filter type is specified
        req.query.filterType = "daily";
    }
    next();
  } catch (error) {
    res.status(400).json({ error: "Invalid parameters" });
  }
};

module.exports = validateDateParams;
