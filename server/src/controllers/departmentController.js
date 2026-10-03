const Department = require('../models/Department');
const Lab = require('../models/Lab');
const User = require('../models/User');

// GET /api/departments
// Query params: ?all=true (to include inactive), ?search=text
exports.getDepartments = async (req, res, next) => {
  try {
    const { all, search } = req.query;
    const filter = {};

    if (all !== 'true') {
      filter.isActive = true;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { headOfDepartment: { $regex: search, $options: 'i' } },
      ];
    }

    const departments = await Department.find(filter).sort({ name: 1 });

    // Aggregate lab & user counts for each department
    const deptWithStats = await Promise.all(
      departments.map(async (dept) => {
        const [labCount, userCount] = await Promise.all([
          Lab.countDocuments({
            $or: [{ department: dept.name }, { department: dept.code }],
          }),
          User.countDocuments({
            $or: [{ department: dept.name }, { department: dept.code }],
          }),
        ]);

        return {
          ...dept.toObject(),
          stats: {
            labs: labCount,
            users: userCount,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      count: deptWithStats.length,
      data: deptWithStats,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/departments/:id
exports.getDepartmentById = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    const associatedLabs = await Lab.find({
      $or: [{ department: dept.name }, { department: dept.code }],
    }).select('labId labName capacity location isMaintenance');

    res.status(200).json({
      success: true,
      data: {
        ...dept.toObject(),
        labs: associatedLabs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/departments
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, headOfDepartment, building, contactEmail, contactPhone, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Department name and code are required.',
      });
    }

    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    // Check duplicate
    const existing = await Department.findOne({
      $or: [{ name: { $regex: `^${cleanName}$`, $options: 'i' } }, { code: cleanCode }],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Department with name "${cleanName}" or code "${cleanCode}" already exists.`,
      });
    }

    const department = await Department.create({
      name: cleanName,
      code: cleanCode,
      headOfDepartment: headOfDepartment?.trim() || '',
      building: building?.trim() || '',
      contactEmail: contactEmail?.trim() || '',
      contactPhone: contactPhone?.trim() || '',
      description: description?.trim() || '',
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully.',
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/departments/:id
exports.updateDepartment = async (req, res, next) => {
  try {
    const { name, code, headOfDepartment, building, contactEmail, contactPhone, description, isActive } = req.body;

    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    const oldName = dept.name;

    if (name) dept.name = name.trim();
    if (code) dept.code = code.toUpperCase().trim();
    if (headOfDepartment !== undefined) dept.headOfDepartment = headOfDepartment.trim();
    if (building !== undefined) dept.building = building.trim();
    if (contactEmail !== undefined) dept.contactEmail = contactEmail.trim();
    if (contactPhone !== undefined) dept.contactPhone = contactPhone.trim();
    if (description !== undefined) dept.description = description.trim();
    if (isActive !== undefined) dept.isActive = Boolean(isActive);

    await dept.save();

    // If name changed, optionally sync associated labs and users so records don't break
    if (name && name.trim() !== oldName) {
      await Promise.all([
        Lab.updateMany({ department: oldName }, { department: name.trim() }),
        User.updateMany({ department: oldName }, { department: name.trim() }),
      ]);
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully.',
      data: dept,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/departments/:id
exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({
        success: false,
        message: 'Department not found.',
      });
    }

    // Check if labs are using this department
    const labCount = await Lab.countDocuments({
      $or: [{ department: dept.name }, { department: dept.code }],
    });

    if (labCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete department: ${labCount} laboratory/laboratories are currently assigned to it. Please reassign or remove the labs first, or set this department to inactive.`,
      });
    }

    await Department.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: `Department "${dept.name}" removed successfully.`,
    });
  } catch (error) {
    next(error);
  }
};
