import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', '..', 'data_store.json');

// Memory cache
let collections = {
  users: [],
  workers: [],
  skills: [],
  assignments: [],
  forecasts: [],
  fairnessReviews: [],
  learningPaths: [],
  auditLogs: [],
  notifications: [],
  systemConfigs: [],
  studentCohorts: []
};

// Persistence helper
function saveToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(collections, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Store] Error writing to disk:', err.message);
  }
}

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      collections = JSON.parse(raw);
      return true;
    }
  } catch (err) {
    console.warn('[Store] Could not read existing data_store.json:', err.message);
  }
  return false;
}

// Model factory with Mongoose-like syntax
function createModel(collectionName) {
  return {
    async find(filter = {}) {
      const items = collections[collectionName] || [];
      return items.filter(item => matchFilter(item, filter)).map(clone);
    },

    async findOne(filter = {}) {
      const items = collections[collectionName] || [];
      const item = items.find(item => matchFilter(item, filter));
      return item ? clone(item) : null;
    },

    async findById(id) {
      const items = collections[collectionName] || [];
      const item = items.find(item => item._id === id || item.id === id);
      return item ? clone(item) : null;
    },

    async create(doc) {
      if (!collections[collectionName]) collections[collectionName] = [];
      const id = doc.id || doc._id || uuidv4();
      const newDoc = {
        ...doc,
        _id: id,
        id: id,
        createdAt: doc.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      collections[collectionName].push(newDoc);
      saveToDisk();
      return clone(newDoc);
    },

    async findByIdAndUpdate(id, update, options = { new: true }) {
      const items = collections[collectionName] || [];
      const index = items.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;

      const current = items[index];
      const updated = {
        ...current,
        ...(update.$set ? update.$set : update),
        updatedAt: new Date().toISOString()
      };
      items[index] = updated;
      saveToDisk();
      return clone(updated);
    },

    async findByIdAndDelete(id) {
      const items = collections[collectionName] || [];
      const index = items.findIndex(item => item._id === id || item.id === id);
      if (index === -1) return null;
      const [removed] = items.splice(index, 1);
      saveToDisk();
      return clone(removed);
    },

    async countDocuments(filter = {}) {
      const items = collections[collectionName] || [];
      return items.filter(item => matchFilter(item, filter)).length;
    },

    async updateOne(filter, update) {
      const items = collections[collectionName] || [];
      const index = items.findIndex(item => matchFilter(item, filter));
      if (index === -1) return { matchedCount: 0, modifiedCount: 0 };
      const current = items[index];
      const updated = {
        ...current,
        ...(update.$set ? update.$set : update),
        updatedAt: new Date().toISOString()
      };
      items[index] = updated;
      saveToDisk();
      return { matchedCount: 1, modifiedCount: 1 };
    },

    async deleteMany(filter = {}) {
      if (!collections[collectionName]) return { deletedCount: 0 };
      const initialLength = collections[collectionName].length;
      collections[collectionName] = collections[collectionName].filter(item => !matchFilter(item, filter));
      saveToDisk();
      return { deletedCount: initialLength - collections[collectionName].length };
    }
  };
}

function matchFilter(item, filter) {
  for (const key in filter) {
    if (key === '$or') {
      const orMatches = filter.$or.some(subFilter => matchFilter(item, subFilter));
      if (!orMatches) return false;
      continue;
    }
    const filterVal = filter[key];
    const itemVal = item[key];
    if (filterVal && typeof filterVal === 'object' && !Array.isArray(filterVal)) {
      if (filterVal.$in && Array.isArray(filterVal.$in)) {
        if (!filterVal.$in.includes(itemVal)) return false;
      } else if (filterVal.$ne !== undefined) {
        if (itemVal === filterVal.$ne) return false;
      } else if (filterVal.$regex) {
        const regex = new RegExp(filterVal.$regex, filterVal.$options || 'i');
        if (!regex.test(String(itemVal || ''))) return false;
      }
    } else if (filterVal !== undefined && itemVal !== filterVal) {
      return false;
    }
  }
  return true;
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function initStoreData(initialData) {
  const loaded = loadFromDisk();
  if (!loaded || !collections.users || collections.users.length === 0) {
    collections = {
      users: initialData.users || [],
      workers: initialData.workers || [],
      skills: initialData.skills || [],
      assignments: initialData.assignments || [],
      forecasts: initialData.forecasts || [],
      fairnessReviews: initialData.fairnessReviews || [],
      learningPaths: initialData.learningPaths || [],
      auditLogs: initialData.auditLogs || [],
      notifications: initialData.notifications || [],
      systemConfigs: initialData.systemConfigs || [],
      studentCohorts: initialData.studentCohorts || []
    };
    saveToDisk();
    console.log('[Store] Initialized and saved default K-12 master dataset.');
  } else {
    console.log('[Store] Loaded existing data store with records:', {
      users: collections.users?.length,
      workers: collections.workers?.length,
      assignments: collections.assignments?.length
    });
  }
}

export function resetStoreData(newData) {
  collections = {
    users: newData.users || [],
    workers: newData.workers || [],
    skills: newData.skills || [],
    assignments: newData.assignments || [],
    forecasts: newData.forecasts || [],
    fairnessReviews: newData.fairnessReviews || [],
    learningPaths: newData.learningPaths || [],
    auditLogs: newData.auditLogs || [],
    notifications: newData.notifications || [],
    systemConfigs: newData.systemConfigs || [],
    studentCohorts: newData.studentCohorts || []
  };
  saveToDisk();
}

// Export repository models
export const User = createModel('users');
export const WorkerProfile = createModel('workers');
export const SkillTaxonomy = createModel('skills');
export const Assignment = createModel('assignments');
export const CapacityForecast = createModel('forecasts');
export const FairnessReview = createModel('fairnessReviews');
export const LearningPath = createModel('learningPaths');
export const AuditLog = createModel('auditLogs');
export const Notification = createModel('notifications');
export const SystemConfig = createModel('systemConfigs');
export const StudentCohort = createModel('studentCohorts');
