const db = require("../models");
const Campus = db.campus;
const { validationResult, check } = require("express-validator");

// Validation rules for Campus
const campusValidationRules = [
    check("campus_name").not().isEmpty().withMessage("Campus name is required"),
    check("location").not().isEmpty().withMessage("Location is required"),
    check("university_id").not().isEmpty().isInt().withMessage("University ID must be an integer")
];

// Get all campuses
exports.getAllCampuses = async (req, res) => {
    try {
        const campuses = await Campus.findAll({
            include: [
                {
                    model: db.university,
                    attributes: ['university_name'], // Specify the attributes you want to retrieve from the University model
                },
            ],
        });

        const modifiedCampuses = campuses.map((campus) => ({
            ...campus.toJSON(),
            university: campus.university ? campus.university.university_name : null, // Check if university data exists and add its name
        }));

        res.status(200).json({ status: true, data: modifiedCampuses });
    } catch (error) {
        console.error(`Error retrieving campuses: ${error}`);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

// Get campus by ID
exports.getCampusById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const campus = await Campus.findByPk(id);
        if (!campus) {
            return res.status(404).json({ status: false, message: "Campus not found" });
        }
        res.status(200).json({ status: true, data: campus });
    } catch (error) {
        console.error(`Error retrieving campus: ${error}`);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

// Add a new campus
exports.addCampus = [
    // Validation middleware
    ...campusValidationRules,
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
        }

        const userId = req.userDecodeId;
        const { campus_name, location, university_id } = req.body;

        try {
            const newCampus = await Campus.create({
                campus_name,
                location,
                university_id,
                updated_by: userId,
            });
            res.status(201).json({ status: true, message: "Campus created successfully", data: newCampus });
        } catch (error) {
            console.error(`Error creating campus: ${error}`);
            res.status(500).json({ status: false, message: "Internal server error" });
        }
    },
];

// Update a campus
exports.updateCampus = [
    // Validation middleware
    ...campusValidationRules,
    async (req, res) => {
        const id = parseInt(req.params.id);
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
        }

        try {
            const userId = req.userDecodeId;
            const campus = await Campus.findByPk(id);
            if (!campus) {
                return res.status(404).json({ status: false, message: "Campus not found" });
            }

            // Update only the fields that are provided in the request body
            const updatedCampus = await campus.update({
                campus_name: req.body.campus_name ?? campus.campus_name,
                location: req.body.location ?? campus.location,
                university_id: req.body.university_id ?? campus.university_id,
                updated_by: userId
            });

            res.status(200).json({ status: true, message: "Campus updated successfully", data: updatedCampus });
        } catch (error) {
            console.error(`Error updating campus: ${error}`);
            res.status(500).json({ status: false, message: "Internal server error" });
        }
    },
];

// Delete a campus
exports.deleteCampus = async (req, res) => {
    const id = parseInt(req.params.id);

    try {
        const campus = await Campus.findByPk(id);
        if (!campus) {
            return res.status(404).json({ status: false, message: "Campus not found" });
        }

        await campus.destroy();
        res.status(200).json({ status: true, message: "Campus deleted successfully" });
    } catch (error) {
        console.error(`Error deleting campus: ${error}`);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};
