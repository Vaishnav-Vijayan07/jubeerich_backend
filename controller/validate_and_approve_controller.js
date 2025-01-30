const { sequelize } = require("../models");
const db = require("../models");
const { Sequelize } = require("sequelize");
const Excel = require("exceljs");
const Source = db.leadSource;
const Channel = db.leadChannel;
const AdminUsers = db.adminUsers;
const OfficeType = db.officeType;
const Region = db.region;
const Franchise = db.franchise;
const UserPrimaryInfo = db.userPrimaryInfo;
const Country = db.country;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { createTaskDesc } = require("../utils/task_description");
const stageDatas = require("../constants/stage_data");
const Piscina = require("piscina");

// Bulk Validation
exports.bulkUploadMultiValidation = async (req, res) => {
    let piscina = null;
    if (!piscina) {
        piscina = new Piscina({
            filename: path.resolve(__dirname, "../workers/validateWorker.js"),
            maxThreads: require("os").cpus().length,
        });
    }

    try {
        const userId = req.userDecodeId;
        const role = req.role_name;
        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        const rows = [];
        const errors = [];
        const validDataResults = [];
        const batchSize = 500;
        const batchPromises = [];
        const formattedErrorData = [];

        // Load mappings once and create lookup maps
        const sources = await Source.findAll({ attributes: ["id", "slug"] });
        const channels = await Channel.findAll({ attributes: ["id", "slug"] });
        const officeTypes = await OfficeType.findAll({ attributes: ["id", "slug"] });
        const countries = await Country.findAll({ attributes: ["id", "country_code"] });
        const regions = await Region.findAll({ attributes: ["id", "slug", "regional_manager_id"] });
        const franchises = await Franchise.findAll({ attributes: ["id", "slug"] });

        const creTl = await AdminUsers.findOne({
            where: { role_id: process.env.CRE_TL_ID },
            include: [{ model: db.accessRoles, attributes: ["role_name"] }],
        });

        // Create lookup maps for efficient lookups
        const createLookupMap = (array, keyField, valueField) =>
            array.reduce((acc, item) => {
                acc[item[keyField]] = item[valueField];
                return acc;
            }, {});

        const mappings = {
            sourceSlugToId: createLookupMap(sources, "slug", "id"),
            channelSlugToId: createLookupMap(channels, "slug", "id"),
            officeTypeSlugToId: createLookupMap(officeTypes, "slug", "id"),
            countryCodeToId: createLookupMap(countries, "country_code", "id"),
            regionSlugToId: createLookupMap(regions, "slug", "id"),
            regionSlugToManagerId: createLookupMap(regions, "slug", "regional_manager_id"),
            franchiseSlugToId: createLookupMap(franchises, "slug", "id")
        };

        const existingRecords = await UserPrimaryInfo.findAll({
            attributes: ["email", "phone"],
        });

        const existingEmails = new Set(existingRecords.map(record => record.email?.toLowerCase().trim()).filter(Boolean));
        const existingPhones = new Set(existingRecords.map(record => record.phone?.trim()).filter(Boolean));

        // Helper function to safely get cell value
        const getCellValue = (cell) => {
            if (!cell) return null;
            if (cell.text) return cell.text.trim();
            if (cell.value) return typeof cell.value === "string" ? cell.value.trim() : cell.value;
            if (cell.result) return typeof cell.result === "string" ? cell.result.trim() : cell.result;
            return null;
        };

        // Load rows into memory
        workbook.eachSheet((worksheet) => {
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 1) {
                    const rowData = {
                        lead_received_date: getCellValue(row.getCell(2)),
                        source_slug: getCellValue(row.getCell(3)),
                        channel_slug: getCellValue(row.getCell(4)),
                        full_name: getCellValue(row.getCell(5)),
                        email: getCellValue(row.getCell(6)),
                        phone: getCellValue(row.getCell(7)),
                        city: getCellValue(row.getCell(8)),
                        office_type_slug: getCellValue(row.getCell(9)),
                        region_or_franchise_slug: getCellValue(row.getCell(10)),
                        preferred_country_code: getCellValue(row.getCell(11)),
                        ielts: getCellValue(row.getCell(12)),
                        remarks: getCellValue(row.getCell(13)),
                    };

                    // Only push rows that have at least email or phone
                    if (rowData.email || rowData.phone) rows.push(rowData);
                }
            });
        });

        // Process rows in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize).map((row, index) => {
                const rowNumber = i + index + 2; // Account for header row
                const { office_type_slug, email, phone, region_or_franchise_slug } = row;
                const isCorporateOffice = office_type_slug === "CORPORATE_OFFICE";
                const isRegion = office_type_slug === "REGION";
                const isFranchise = office_type_slug === "FRANCHISE";

                const normalizedEmail = email?.toLowerCase().trim();
                const normalizedPhone = phone?.trim();

                // Check for duplicates
                if (
                    (normalizedEmail && existingEmails.has(normalizedEmail)) ||
                    (normalizedPhone && existingPhones.has(normalizedPhone))
                ) {
                    errors.push({
                        rowNumber,
                        rowData: row,
                        errors: ["Email or phone already exists in Database"],
                    });
                    return null;
                }

                return {
                    rowNumber,
                    rowData: {
                        lead_received_date: row.lead_received_date,
                        source_id: mappings.sourceSlugToId[row.source_slug],
                        channel_id: mappings.channelSlugToId[row.channel_slug],
                        full_name: row.full_name,
                        email: normalizedEmail,
                        phone: normalizedPhone,
                        city: row.city,
                        office_type: mappings.officeTypeSlugToId[office_type_slug],
                        preferred_country: mappings.countryCodeToId[row.preferred_country_code],
                        ielts: row.ielts,
                        remarks: row.remarks,
                        assigned_cre_tl: isCorporateOffice && creTl ? creTl.id : null,
                        created_by: userId,
                        region_id: isRegion ? mappings.regionSlugToId[row.region_or_franchise_slug] : null,
                        franchise_id: isFranchise ? mappings.franchiseSlugToId[row.region_or_franchise_slug] : null,
                        assigned_regional_manager: isRegion ? mappings.regionSlugToManagerId[row.region_or_franchise_slug] : null,
                        stage: isCorporateOffice
                            ? stageDatas.cre
                            : isRegion
                                ? stageDatas.regional_manager
                                : isFranchise
                                    ? stageDatas.counsellor
                                    : stageDatas.unknown,
                    },
                };
            }).filter(Boolean);

            batchPromises.push(piscina.run({ rows: batch, meta: { startRow: i + 2 } }));
        }

        const results = await Promise.all(batchPromises);

        // Merge errors and valid data
        results.forEach((result) => {
            if (result.errors) errors.push(...result.errors);
            if (result.validData) validDataResults.push(...result.validData);
        });

        // Handle errors and generate error file if any
        let errorFilePath;
        if (errors.length > 0) {
            const errorWorkbook = new Excel.Workbook();
            const errorSheet = errorWorkbook.addWorksheet("Errors");
            const headerRow = workbook.getWorksheet(1).getRow(1).values;
            headerRow.push("Errors");
            errorSheet.addRow(headerRow);

            errors.forEach(({ rowNumber, rowData, errors }) => {
                const errorDetails = Array.isArray(errors) ? errors.join("; ") : errors;
                const worksheet = workbook.getWorksheet(1);
                const existRow = worksheet.getRow(rowNumber);

                const data = {
                    lead_received_date: getCellValue(existRow.getCell(2)),
                    source: getCellValue(existRow.getCell(3)),
                    channel: getCellValue(existRow.getCell(4)),
                    full_name: getCellValue(existRow.getCell(5)),
                    email: getCellValue(existRow.getCell(6)),
                    phone: getCellValue(existRow.getCell(7)),
                    city: getCellValue(existRow.getCell(8)),
                    office_type: getCellValue(existRow.getCell(9)),
                    region_or_franchise: getCellValue(existRow.getCell(10)),
                    preferred_country_code: getCellValue(existRow.getCell(11)),
                    ielts: getCellValue(existRow.getCell(12)),
                    remarks: getCellValue(existRow.getCell(13)),
                    error: errorDetails,
                };

                const rowWithErrors = [
                    rowNumber,
                    ...Array(12)
                        .fill(0)
                        .map((_, i) => getCellValue(existRow.getCell(i + 2))),
                    errorDetails,
                ];

                formattedErrorData.push(data);
                errorSheet.addRow(rowWithErrors);
            });

            const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
            errorFilePath = path.join("uploads/rejected_files", errorFileName);
            await errorWorkbook.xlsx.writeFile(errorFilePath);
        }

        // Process valid data
        const formattedValidData = validDataResults.map(({ rowNumber, rowData }) => {
            const worksheet = workbook.getWorksheet(1);
            const existRow = worksheet.getRow(rowNumber);

            return {
                lead_received_date: getCellValue(existRow.getCell(2)),
                source: getCellValue(existRow.getCell(3)),
                channel: getCellValue(existRow.getCell(4)),
                full_name: getCellValue(existRow.getCell(5)),
                email: getCellValue(existRow.getCell(6)),
                phone: getCellValue(existRow.getCell(7)),
                city: getCellValue(existRow.getCell(8)),
                office_type: getCellValue(existRow.getCell(9)),
                region_or_franchise: getCellValue(existRow.getCell(10)),
                preferred_country_code: getCellValue(existRow.getCell(11)),
                ielts: getCellValue(existRow.getCell(12)),
                remarks: getCellValue(existRow.getCell(13)),
            };
        });

        // Combine the results
        const mergedResults = [...formattedErrorData, ...formattedValidData];

        return res.status(200).json({
            status: true,
            message: "Please check and approve the results",
            invalidFileLink: errorFilePath,
            data: mergedResults,
            sources,
            channels,
            officeTypes,
            regions,
            franchises,
            countries,
        });
    } catch (error) {
        console.error("Error processing bulk upload:", error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    } finally {
        if (piscina) {
            await piscina.close();
            console.log("Piscina Instance Destroyed");
        }
    }
};

// Bulk Upload
exports.bulkUploadMultiCore = async (req, res) => {
    let piscina = null;
    if (!piscina) {
        piscina = new Piscina({
            filename: path.resolve(__dirname, "../workers/worker.js"),
            maxThreads: require("os").cpus().length,
        });
    }

    try {
        const userId = req.userDecodeId;
        const role = req.role_name;
        const { lead_data } = req.body;

        console.log('Leads', lead_data);


        const rows = [];
        const errors = [];
        const batchSize = 500;
        let batchPromises = [];

        // Load mappings
        const sources = await Source.findAll({ attributes: ["id", "slug"] });
        const channels = await Channel.findAll({ attributes: ["id", "slug"] });
        const officeTypes = await OfficeType.findAll({ attributes: ["id", "slug"] });
        const countries = await Country.findAll({ attributes: ["id", "country_code"] });
        const regions = await Region.findAll({ attributes: ["id", "slug", "regional_manager_id"] });
        const franchises = await Franchise.findAll({ attributes: ["id", "slug"] });

        const creTl = await AdminUsers.findOne({
            where: { role_id: process.env.CRE_TL_ID },
            include: [
                {
                    model: db.accessRoles,
                    attributes: ["role_name"],
                },
            ],
        });

        // Create lookup maps
        const createLookupMap = (array, keyField, valueField) =>
            array.reduce((acc, item) => {
                acc[item[keyField]] = item[valueField];
                return acc;
            }, {});

        const sourceSlugToId = createLookupMap(sources, "slug", "id");
        const channelSlugToId = createLookupMap(channels, "slug", "id");
        const officeTypeSlugToId = createLookupMap(officeTypes, "slug", "id");
        const countryCodeToId = createLookupMap(countries, "country_code", "id");
        const regionSlugToId = createLookupMap(regions, "slug", "id");
        const regionSlugToManagerId = createLookupMap(regions, "slug", "regional_manager_id");
        const franchiseSlugToId = createLookupMap(franchises, "slug", "id");

        const formatValue = (value) => {
            if (!value) return null;

            if (value) {
                return typeof value == "string" ? value.trim() : value;
            }

            return null;
        };

        // Check for existing records
        const existingRecords = await UserPrimaryInfo.findAll({
            attributes: ["email", "phone"],
        });

        const existingEmails = new Set(existingRecords.map((record) => record.email?.toLowerCase().trim()).filter(Boolean));

        const existingPhones = new Set(existingRecords.map((record) => record.phone?.trim()).filter(Boolean));

        // Load rows into memory with improved cell reading
        lead_data.forEach((row, rowNumber) => {
            const rowData = {
                lead_received_date: row?.lead_received_date,
                source_slug: formatValue(row?.source),
                channel_slug: formatValue(row?.channel),
                full_name: row?.full_name,
                email: formatValue(row?.email),
                phone: formatValue(row?.phone),
                city: row?.city,
                office_type_slug: formatValue(row?.office_type),
                region_or_franchise_slug: row?.region_or_franchise,
                preferred_country_code: row?.preferred_country_code,
                ielts: row?.ielts,
                remarks: row?.remarks,
            };

            // Only push rows that have at least email or phone
            if (rowData.email || rowData.phone) {
                rows.push(rowData);
            }
        });

        // Process rows in batches
        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = {
                rows: rows
                    .slice(i, i + batchSize)
                    .map((row, index) => {
                        const rowNumber = i + index + 2; // Account for header row
                        const officeTypeSlug = row.office_type_slug;

                        const isCorporateOffice = officeTypeSlug === "CORPORATE_OFFICE";
                        const isRegion = officeTypeSlug === "REGION";
                        const isFranchise = officeTypeSlug === "FRANCHISE";

                        // Normalize email and phone
                        const normalizedEmail = row.email?.toLowerCase().trim();
                        const normalizedPhone = row.phone?.trim();

                        // Check for duplicates
                        if (
                            (normalizedEmail && existingEmails.has(normalizedEmail)) ||
                            (normalizedPhone && existingPhones.has(normalizedPhone))
                        ) {
                            errors.push({
                                rowNumber,
                                rowData: row,
                                errors: ["Email or phone already exists in Database"],
                            });
                            return null;
                        }

                        return {
                            rowNumber,
                            rowData: {
                                lead_received_date: row.lead_received_date,
                                source_id: sourceSlugToId[row.source_slug],
                                channel_id: channelSlugToId[row.channel_slug],
                                full_name: row.full_name,
                                email: normalizedEmail,
                                phone: normalizedPhone,
                                city: row.city,
                                office_type: officeTypeSlugToId[officeTypeSlug],
                                preferred_country: countryCodeToId[row.preferred_country_code],
                                ielts: row.ielts,
                                remarks: row.remarks,
                                assigned_cre_tl: isCorporateOffice && creTl ? creTl.id : null,
                                created_by: userId,
                                region_id: isRegion ? regionSlugToId[row.region_or_franchise_slug] : null,
                                franchise_id: isFranchise ? franchiseSlugToId[row.region_or_franchise_slug] : null,
                                assigned_regional_manager: isRegion ? regionSlugToManagerId[row.region_or_franchise_slug] : null,
                                stage: isCorporateOffice
                                    ? stageDatas.cre
                                    : isRegion
                                        ? stageDatas.regional_manager
                                        : isFranchise
                                            ? stageDatas.counsellor
                                            : stageDatas.unknown,
                            },
                        };
                    })
                    .filter(Boolean),
                meta: { startRow: i + 2 },
                userDecodeId: userId,
                role: role,
                creTLrole: creTl?.access_role?.role_name,
            };

            batchPromises.push(piscina.run(batch));
        }

        const results = await Promise.all(batchPromises);

        return res.status(200).json({
            status: true,
            message: "Leads approved successfully",
        });
    } catch (error) {
        console.error("Error processing lead approval:", error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    } finally {
        if (piscina) {
            await piscina.close();
            console.log("Piscina Destroyed");
        }
    }
};

// Get Approval Options ( Slugs )
exports.getApprovalOptions = async (req, res) => {
    try {
        const sources = await Source.findAll({ attributes: ["id", "slug"] });
        const channels = await Channel.findAll({ attributes: ["id", "slug"] });
        const officeTypes = await OfficeType.findAll({ attributes: ["id", "slug"] });
        const countries = await Country.findAll({ attributes: ["id", "country_code"] });
        const regions = await Region.findAll({ attributes: ["id", "slug", "regional_manager_id"] });
        const franchises = await Franchise.findAll({ attributes: ["id", "slug"] });

        return res.status(200).json({
            data: {
                sources,
                channels,
                officeTypes,
                countries,
                regions,
                franchises,
            }
        });
    } catch (error) {
        console.error("Error fetching approval options:", error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while fetching approval options. Please try again later",
        });
    }
};

// Auto Assign Validation - CRE TL
exports.autoAssignValidation = async (req, res) => {
    const { leads_ids } = req.body;
    const userId = req.userDecodeId;

    if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
        return res.status(400).json({
            status: false,
            message: "leads_ids must be a non-empty array",
        });
    }

    if (!leads_ids.every((id) => typeof id === "number")) {
        return res.status(400).json({
            status: false,
            message: "Each user_id must be a number",
        });
    }

    try {
        let validatedData = [];

        const creList = await db.adminUsers.findAll({
            attributes:
                ["id", "name"],
            where: {
                [Sequelize.Op.or]: [{ role_id: process.env.CRE_ID }, { role_id: process.env.CRE_TL_ID }],
                status: true,
            },
        });

        let leastCre = await getLeastAssignedCre();

        if (leastCre.length == 0) {
            throw new Error("No available CREs to assign leads");
        }

        for (const id of leads_ids) {
            const userInfo = await UserPrimaryInfo.findOne({
                where: { id },
                include: {
                    model: db.country,
                    as: "preferredCountries",
                },
            });

            const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

            let currentCre = leastCre[0].user_id;

            const dueDate = new Date();

            const taskData = {
                studentId: id,
                full_name: userInfo.full_name,
                email: userInfo.email,
                phone: userInfo.phone,
                city: userInfo.city,
                country: countries,
                assigned_cre: currentCre,
                assign_type: "auto_assign",
                lead_received_date: userInfo.lead_received_date,
                updatedBy: userId,
            };

            validatedData.push(taskData);

            leastCre[0].assignment_count += 1;

            leastCre.sort((a, b) => a.assignment_count - b.assignment_count);
        }

        res.status(200).json({
            status: true,
            message: "Leads assigned successfully",
            assignedData: validatedData,
            creList: creList
        });

    } catch (error) {
        console.error("Error in autoAssign:", error);
        res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    }
};

// Auto Assign Approval - CRE TL
exports.autoAssignValidData = async (req, res) => {
    const { lead_data } = req.body;
    const userId = req.userDecodeId;

    if (!Array.isArray(lead_data) || lead_data.length === 0) {
        return res.status(400).json({
            status: false,
            message: "No Leads Found",
        });
    }

    const transaction = await sequelize.transaction();

    try {
        const updatePromises = lead_data.map(async (data, index) => {
            const { studentId, assigned_cre } = data;

            const userInfo = await UserPrimaryInfo.findOne({
                where: studentId,
                include: {
                    model: db.country,
                    as: "preferredCountries",
                },
            });

            let formattedDesc = await createTaskDesc(userInfo, studentId);

            if (!formattedDesc) {
                return res.status(500).json({
                    status: false,
                    message: "Description error",
                });
            }

            const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

            const dueDate = new Date();

            const task = await db.tasks.upsert(
                {
                    studentId: studentId,
                    userId: assigned_cre,
                    title: `${userInfo.full_name} - ${countries}`,
                    description: formattedDesc,
                    dueDate: dueDate,
                    updatedBy: userId,
                    assigned_country: userInfo.preferredCountries?.[0]?.id,
                },
                { transaction }
            );
            return UserPrimaryInfo.update(
                {
                    assigned_cre: assigned_cre,
                    assign_type: "auto_assign",
                    updated_by: userId,
                },
                { where: { id: studentId }, transaction }
            );
        });

        await Promise.all(updatePromises);

        await transaction.commit();

        res.status(200).json({
            status: true,
            message: "Leads assigned successfully",
        });
    } catch (error) {
        await transaction.rollback();
        console.error("Error in autoAssign:", error);
        res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    }
};

// Auto Assign Validation - Application Manager
exports.autoAssignApplicationValidation = async (req, res) => {
    const { application_ids } = req.body;

    if (!Array.isArray(application_ids) || application_ids.length === 0) {
        return res.status(400).json({
            status: false,
            message: "application_ids must be a non-empty array",
        });
    }

    if (!application_ids.every((id) => typeof id === "number")) {
        return res.status(400).json({
            status: false,
            message: "Each application_id must be a number",
        });
    }

    const transaction = await sequelize.transaction();

    try {
        let validatedData = [];

        const teamMembers = await db.adminUsers.findAll({
            attributes: ["id", "username"],
            where: {
                [Sequelize.Op.or]: [
                    { role_id: process.env.APPLICATION_TEAM_ID },
                    { role_id: process.env.APPLICATION_MANAGER_ID }
                ],
                status: true,
            },
            transaction,
        });

        let leastAssignedUsers = await getLeastAssignedApplicationMembersList();

        if (leastAssignedUsers.length === 0) {
            throw new Error("No available members to assign applications");
        }

        const applications = await db.application.findAll({
            where: { id: { [Sequelize.Op.in]: application_ids } },
            attributes: ["id", "studyPrefernceId", "counsellor_id"],
            include: [
                {
                    model: db.studyPreferenceDetails,
                    as: "studyPreferenceDetails",
                    attributes: ["id"],
                    include: [
                        {
                            model: db.studyPreference,
                            as: "studyPreference",
                            attributes: ["id"],
                            include: [
                                {
                                    model: db.userPrimaryInfo,
                                    as: "userPrimaryInfo",
                                    attributes: ["id", "full_name", "lead_received_date"],
                                },
                                {
                                    model: db.country,
                                    as: "country",
                                    attributes: ["country_name"],
                                }
                            ],
                        },
                        {
                            model: db.university,
                            attributes: ["id", "university_name"],
                            as: "preferred_university",
                        },
                        {
                            model: db.campus,
                            attributes: ["id", "campus_name"],
                            as: "preferred_campus",
                        },
                        {
                            model: db.course,
                            attributes: ["id", "course_name"],
                            as: "preferred_courses",
                        }
                    ],
                },
                {
                    model: db.adminUsers,
                    attributes: ["id", "name"],
                    as: "counsellor",
                }
            ],
        }, { transaction });

        if (applications.length !== application_ids.length) {
            throw new Error("One or more applications not found");
        }

        for (const app of applications) {
            let currentAssignee = leastAssignedUsers[0].user_id;

            const assignmentData = {
                application_id: app.id,
                full_name: app.studyPreferenceDetails.studyPreference.userPrimaryInfo.full_name,
                counsellor: app.counsellor.name,
                lead_received_date: app.studyPreferenceDetails.studyPreference.userPrimaryInfo.lead_received_date,
                assigned_to: currentAssignee,
                university_name: app.studyPreferenceDetails.preferred_university.university_name,
                campus_name: app.studyPreferenceDetails.preferred_campus.campus_name,
                course_name: app.studyPreferenceDetails.preferred_courses.course_name,
                country: app.studyPreferenceDetails.studyPreference.country.country_name,
                assigned_by: req.userDecodeId,
            };

            validatedData.push(assignmentData);

            leastAssignedUsers[0].assignment_count += 1;

            leastAssignedUsers.sort((a, b) => a.assignment_count - b.assignment_count);
        }

        await transaction.commit();

        return res.status(200).json({
            status: true,
            message: "Applications assigned successfully",
            assignedData: validatedData,
            teamMembers,
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error in autoAssignApplicationValidation:", error.message || error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    }
};

// Auto Assign Approval - Application Manager
exports.autoAssignApprovedData = async (req, res) => {
    const { lead_data } = req.body;

    if (!Array.isArray(lead_data) || lead_data.length === 0) {
        return res.status(400).json({
            status: false,
            message: "lead data must be a non-empty array",
        });
    }

    const transaction = await sequelize.transaction();

    try {
        const updatePromises = lead_data.map(({ application_id, assigned_to }) =>
            db.application.update(
                { assigned_user: assigned_to },
                { where: { id: application_id }, transaction }
            )
        );

        await Promise.all(updatePromises);

        await transaction.commit();

        return res.status(200).json({
            status: true,
            message: "Applications assigned successfully",
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error in autoAssignApplicationValidation:", error.message || error);
        return res.status(500).json({
            status: false,
            message: "An error occurred while processing your request. Please try again later.",
        });
    }
};

// Get least assigned application members
const getLeastAssignedApplicationMembersList = async () => {
    try {
        const leastAssignedMembers = await db.adminUsers.findAll({
            attributes: [
                ["id", "user_id"],
                "username",
                [
                    Sequelize.literal(`(
                          SELECT COUNT(*)
                          FROM "application_details"
                          WHERE "application_details"."assigned_user" = "admin_user"."id"
                      )`),
                    "assignment_count",
                ],
            ],
            where: {
                [Sequelize.Op.or]: [
                    { role_id: process.env.APPLICATION_TEAM_ID },
                    { role_id: process.env.APPLICATION_MANAGER_ID }
                ],
            },
            order: [
                [
                    Sequelize.literal(`(
                          SELECT COUNT(*)
                          FROM "application_details"
                          WHERE "application_details"."assigned_user" = "admin_user"."id"
                      )`),
                    "ASC",
                ],
            ],
        });

        if (!leastAssignedMembers.length) return [];

        return leastAssignedMembers.map(member => ({
            user_id: member.dataValues.user_id,
            username: member.dataValues.username,
            assignment_count: parseInt(member.dataValues.assignment_count, 10),
        }));
    } catch (error) {
        console.error("Error fetching least assigned members:", error.message || error);
        throw error;
    }
};

// Get least assigned CRE
const getLeastAssignedCre = async () => {
    try {
        // Fetch all CREs with their current assignment counts
        const creList = await db.adminUsers.findAll({
            attributes: [
                ["id", "user_id"],
                "username",
                [
                    Sequelize.literal(`(
                SELECT COUNT(*)
                FROM "user_primary_info"
                WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
              )`),
                    "assignment_count",
                ],
            ],
            where: {
                [Sequelize.Op.or]: [{ role_id: process.env.CRE_ID }, { role_id: process.env.CRE_TL_ID }],
                status: true,
            },
            order: [
                [
                    Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "user_primary_info"
              WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
            )`),
                    "ASC",
                ],
            ],
        });

        return creList.map((cre) => ({
            user_id: cre.dataValues.user_id,
            assignment_count: parseInt(cre.dataValues.assignment_count, 10),
        }));
    } catch (error) {
        console.error("Error fetching CREs with assignment counts:", error.message || error);
        throw error;
    }
};
