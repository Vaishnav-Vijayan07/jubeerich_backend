const processCardData = (counts) => {
  const totalLeads = counts[0]?.total_lead_count || 0;
  // Define the base structure of the cards
  const defaultCards = [
    { id: 1, title: "total leads", stats: totalLeads, icon: "fe-users", bgColor: "#5bc0de" }, // Blue for general data
    { id: 2, title: "spam leads", stats: "0", icon: "fe-alert-triangle", bgColor: "#f0ad4e" }, // Orange for warnings
    { id: 3, title: "closed leads", stats: "0", icon: "fe-check-circle", bgColor: "#5cb85c" }, // Green for success
    { id: 4, title: "prospective leads", stats: "0", icon: "fe-briefcase", bgColor: "#5bc0de" }, // Green for success
    { id: 5, title: "failed Leads", stats: "0", icon: "fe-x-circle", bgColor: "#d9534f" }, // Red for errors
  ];

  const metaData = {
    spam_leads: {
      id: 2,
      icon: "fe-alert-triangle",
      bgColor: "#f0ad4e",
    },
    closed_leads: {
      id: 3,
      icon: "fe-check-circle",
      bgColor: "#5cb85c",
    },
    prospective_leads: {
      id: 4,
      icon: "fe-check-circle",
      bgColor: "#5cb85c",
    },
    failed_leads: {
      id: 5,
      icon: "fe-x-circle",
      bgColor: "#d9534f",
    },
  };

  let statCards = [...defaultCards];

  counts.forEach((count) => {
    const card = metaData[count.type_name];
    if (card) {
      statCards[card.id - 1].stats = count.count;
    }
  });

  return { statCards };
};

const transformOfficeToStackData = (roleWiseData, graphCategory, statustyps) => {
  // Map categories from graphCategory
  const categories = graphCategory.map((office) => {
    const nameKey = Object.keys(office).find((key) => key.toLowerCase().includes("name"));
    return nameKey ? office[nameKey] : null;
  });

  // Create a map to track series data for each status type
  const seriesMap = new Map(statustyps.map((type) => [type.type_name, Array(categories.length).fill(0)]));

  // Populate the series data based on roleWiseData
  roleWiseData.forEach((item) => {
    const name = item.name;
    const typeName = item.type_name;
    const count = parseInt(item.count, 10);

    // Find the index of the admin name in categories
    const categoryIndex = categories.indexOf(name);
    if (categoryIndex !== -1 && seriesMap.has(typeName)) {
      seriesMap.get(typeName)[categoryIndex] += count;
    }
  });

  // Format series data
  const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
    name: name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()),
    data,
  }));

  return { stackCategories: categories, stackSeries: roleWiseData.length > 0 ? series : [] };
};

const transformOfficeToBarData = (roleWiseData, statustyps) => {
  // Create a map for roleWiseData counts for easy lookup
  const roleWiseDataMap = roleWiseData.reduce((map, item) => {
    map[item.type_name] = parseInt(item.count, 10) || 0;
    return map;
  }, {});
  // Build the series data using the categories
  const seriesData = statustyps.map((category) => roleWiseDataMap[category.type_name] || 0);
  const series = [
    {
      name: "Count",
      data: seriesData,
    },
  ];
  const categories = statustyps.map(
    (category) =>
      category.type_name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(" ") // Join words with a space
  );
  return { barCategories: categories, barSeries: roleWiseData.length > 0 ? series : [] };
};

const generatePieData = (applicationData) => {
  const labels = Object.keys(applicationData).map((label) => label.charAt(0).toUpperCase() + label.slice(1));
  const pieSeries = Object.values(applicationData).map((series) => Number(series));
  return {
    pieCategories: labels,
    pieSeries: pieSeries,
  };
};

const generateCardForApplication = (applicationData) => {
  const colors = {
    availability_check: {
      bgColor: "#FFEBEE", // Light Red
      icon: "fe-check-circle", // Represents general checks
    },
    campus_check: {
      bgColor: "#E3F2FD", // Light Blue
      icon: "fe-home", // Represents campus/home
    },
    entry_requirement_check: {
      bgColor: "#FFF3E0", // Light Orange
      icon: "fe-clipboard", // Represents requirements/documentation
    },
    quantity_check: {
      bgColor: "#ECEFF1", // Light Gray
      icon: "fe-layers", // Represents quantity
    },
    quality_check: {
      bgColor: "#E0F2F1", // Light Teal
      icon: "fe-camera", // Represents scanning
    },
    immigration_check: {
      bgColor: "#E8F5E9", // Light Green
      icon: "fe-globe", // Represents global/immigration
    },
    application_fee_check: {
      bgColor: "#FFFDE7", // Light Yellow
      icon: "fe-dollar-sign", // Represents fee/payment
    },
  };

  // Calculate total applications from the input data
  const totalApplications = applicationData.reduce((acc, data) => acc + parseInt(data.stats, 10), 0);

  // Ensure the order by iterating over the keys of colors
  const cardData = Object.keys(colors)
    .filter((key) => key !== "total_application_count") // Exclude total_application_count for now
    .map((key, index) => {

      const data = applicationData.find((item) => item.title === key);

      return {
        id: index,
        title: formatString(key),
        stats: data?.stats || 0, // Default to 0 if not found
        icon: colors[key].icon,
        bgColor: colors[key].bgColor,
      };
    });

  // Add the total applications card at the end
  cardData.unshift({
    id: cardData.length,
    title: "Total Applications",
    stats: totalApplications,
    icon: "fe-users",
    bgColor: "#5bc0de",
  });

  return { cardData };
};

const generateStackDataForApplication = (applicationData) => {


  if(applicationData.length == 0){
    return { applicationCategories: [], applicationSeries: [] };
  }

  // Extract categories (users)
  const applicationCategories = applicationData.map((item) => item.user);

  // Initialize series data structure
  const checkKeys = Object.keys(applicationData[0]?.check_counts); // Get all check keys from the first item
  const applicationSeries = checkKeys.map((key) => ({
    name: formatString(key),
    data: applicationData.map((item) => item.check_counts[key]), // Extract data for each user
  }));

  return { applicationCategories, applicationSeries };
};

const formatString = (str) => {
  // Remove underscores, capitalize first character, and lowercase the rest
  return str
    ?.replace(/_/g, " ") // Replace underscores with spaces
    ?.toLowerCase() // Convert entire string to lowercase
    ?.replace(/^\w/, (c) => c.toUpperCase()); // Capitalize the first character
};

module.exports = {
  processCardData,
  transformOfficeToStackData,
  transformOfficeToBarData,
  generatePieData,
  generateCardForApplication,
  generateStackDataForApplication,
};

[
  {
    user: "Application Manager",
    check_counts: {
      availability_check: 1,
      campus_check: 0,
      entry_requirement_check: 0,
      quantity_check: 0,
      quality_check_clarity: 0,
      quality_check_scanning: 0,
      quality_check_formatting: 0,
      immigration_check: 0,
      application_fee_check: 0,
    },
  },
  {
    user: "Application Team",
    check_counts: {
      availability_check: 1,
      campus_check: 0,
      entry_requirement_check: 0,
      quantity_check: 0,
      quality_check_clarity: 0,
      quality_check_scanning: 0,
      quality_check_formatting: 0,
      immigration_check: 0,
      application_fee_check: 0,
    },
  },
  {
    user: "Application Team 2",
    check_counts: {
      availability_check: 1,
      campus_check: 0,
      entry_requirement_check: 0,
      quantity_check: 0,
      quality_check_clarity: 0,
      quality_check_scanning: 0,
      quality_check_formatting: 0,
      immigration_check: 0,
      application_fee_check: 0,
    },
  },
];
