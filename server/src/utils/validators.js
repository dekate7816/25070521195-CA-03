/**
 * Request validation and sanitization utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

export function validateEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > 254) return false;
  return EMAIL_REGEX.test(normalized);
}

export function validatePassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 8 && password.length <= 128;
}

export function validateTaskInput(data, isUpdate = false) {
  const errors = [];
  const sanitized = {};

  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.push('Title is required and must be a non-empty string');
    } else if (data.title.trim().length > 200) {
      errors.push('Title must be 200 characters or fewer');
    } else {
      sanitized.title = data.title.trim();
    }
  }

  if (data.description !== undefined) {
    if (data.description === null || data.description === '') {
      sanitized.description = '';
    } else if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 2000) {
      errors.push('Description must be 2000 characters or fewer');
    } else {
      sanitized.description = data.description.trim();
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['todo', 'in_progress', 'completed'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    } else {
      sanitized.status = data.status;
    }
  }

  if (data.priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(data.priority)) {
      errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
    } else {
      sanitized.priority = data.priority;
    }
  }

  if (data.dueDate !== undefined) {
    if (data.dueDate === null || data.dueDate === '') {
      sanitized.dueDate = null;
    } else {
      const parsed = new Date(data.dueDate);
      if (isNaN(parsed.getTime())) {
        errors.push('dueDate must be a valid date or null');
      } else {
        sanitized.dueDate = parsed.toISOString();
      }
    }
  }

  if (data.categoryId !== undefined) {
    if (data.categoryId === null || data.categoryId === '') {
      sanitized.categoryId = null;
    } else if (typeof data.categoryId === 'string') {
      sanitized.categoryId = data.categoryId.trim();
    } else {
      errors.push('categoryId must be a string or null');
    }
  }

  if (data.tags !== undefined) {
    if (!Array.isArray(data.tags)) {
      errors.push('tags must be an array of strings');
    } else {
      sanitized.tags = data.tags
        .filter(t => typeof t === 'string' && t.trim().length > 0)
        .map(t => t.trim().toLowerCase())
        .slice(0, 10);
    }
  }

  return { isValid: errors.length === 0, errors, data: sanitized };
}

export function validateHabitInput(data, isUpdate = false) {
  const errors = [];
  const sanitized = {};

  if (!isUpdate || data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    } else if (data.name.trim().length > 200) {
      errors.push('Name must be 200 characters or fewer');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  if (data.description !== undefined) {
    if (data.description === null || data.description === '') {
      sanitized.description = '';
    } else if (typeof data.description !== 'string') {
      errors.push('Description must be a string');
    } else if (data.description.length > 1000) {
      errors.push('Description must be 1000 characters or fewer');
    } else {
      sanitized.description = data.description.trim();
    }
  }

  if (!isUpdate || data.schedule !== undefined) {
    if (!data.schedule || typeof data.schedule !== 'object') {
      errors.push('schedule must be an object specifying frequency');
    } else {
      const type = data.schedule.type;
      if (type !== 'daily' && type !== 'weekly') {
        errors.push('schedule.type must be "daily" or "weekly"');
      } else {
        const scheduleObj = { type };
        if (type === 'weekly') {
          if (!Array.isArray(data.schedule.days) || data.schedule.days.length === 0) {
            errors.push('schedule.days must be a non-empty array of day numbers (0-6 where 0=Sunday)');
          } else {
            const validDays = [...new Set(data.schedule.days)]
              .map(d => parseInt(d, 10))
              .filter(d => !isNaN(d) && d >= 0 && d <= 6)
              .sort();
            if (validDays.length === 0) {
              errors.push('schedule.days must contain at least one valid day from 0 to 6');
            } else {
              scheduleObj.days = validDays;
            }
          }
        }
        sanitized.schedule = scheduleObj;
      }
    }
  }

  if (data.categoryId !== undefined) {
    if (data.categoryId === null || data.categoryId === '') {
      sanitized.categoryId = null;
    } else if (typeof data.categoryId === 'string') {
      sanitized.categoryId = data.categoryId.trim();
    } else {
      errors.push('categoryId must be a string or null');
    }
  }

  if (data.startDate !== undefined) {
    if (!data.startDate) {
      sanitized.startDate = new Date().toISOString().slice(0, 10);
    } else {
      const parsed = new Date(data.startDate);
      if (isNaN(parsed.getTime())) {
        errors.push('startDate must be a valid date');
      } else {
        sanitized.startDate = parsed.toISOString().slice(0, 10);
      }
    }
  }

  if (data.endDate !== undefined) {
    if (data.endDate === null || data.endDate === '') {
      sanitized.endDate = null;
    } else {
      const parsed = new Date(data.endDate);
      if (isNaN(parsed.getTime())) {
        errors.push('endDate must be a valid date or null');
      } else {
        sanitized.endDate = parsed.toISOString().slice(0, 10);
      }
    }
  }

  if (data.reminderTime !== undefined) {
    if (data.reminderTime === null || data.reminderTime === '') {
      sanitized.reminderTime = null;
    } else if (typeof data.reminderTime === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(data.reminderTime)) {
      sanitized.reminderTime = data.reminderTime;
    } else {
      errors.push('reminderTime must be in HH:mm 24-hour format or null');
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['active', 'paused', 'archived'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    } else {
      sanitized.status = data.status;
    }
  }

  return { isValid: errors.length === 0, errors, data: sanitized };
}

export function validateCategoryInput(data, isUpdate = false) {
  const errors = [];
  const sanitized = {};

  if (!isUpdate || data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Category name is required and cannot be empty');
    } else if (data.name.trim().length > 50) {
      errors.push('Category name must be 50 characters or fewer');
    } else {
      sanitized.name = data.name.trim();
    }
  }

  if (data.color !== undefined) {
    if (typeof data.color !== 'string') {
      sanitized.color = '#4f46e5';
    } else {
      const colorTrimmed = data.color.trim();
      if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(colorTrimmed)) {
        sanitized.color = colorTrimmed;
      } else {
        sanitized.color = '#4f46e5';
      }
    }
  }

  return { isValid: errors.length === 0, errors, data: sanitized };
}

export function validateDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) && !isNaN(new Date(dateStr).getTime());
}
