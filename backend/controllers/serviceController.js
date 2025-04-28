const Service = require('../models/Service');

// Get all services for the current provider
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ provider: req.user.id });

    res.status(200).json({
      status: 'success',
      results: services.length,
      data: {
        services
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get a specific service by ID
exports.getService = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Service ID is required'
      });
    }

    const service = await Service.findOne({ _id: req.params.id, provider: req.user.id });

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create a new service
exports.createService = async (req, res) => {
  try {
    const newService = await Service.create({
      ...req.body,
      provider: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        service: newService
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update an existing service
exports.updateService = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Service ID is required'
      });
    }

    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, provider: req.user.id },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        service
      }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete a service
exports.deleteService = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Service ID is required'
      });
    }

    const service = await Service.findOneAndDelete({ _id: req.params.id, provider: req.user.id });

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};
