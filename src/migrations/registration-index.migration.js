const mongoose = require('mongoose');

/**
 * Drops the old { studentId: 1, eventId: 1 } unique index from the registrations collection.
 * This is needed because the schema now uses { studentId: 1, eventId: 1, topic: 1 }.
 * Mongoose auto-creates new indexes but does NOT auto-drop old ones.
 */
async function migrateRegistrationIndex() {
  try {
    const collection = mongoose.connection.collection('registrations');
    const indexes = await collection.indexes();
    
    // Look for the old 2-field index
    const oldIndex = indexes.find(idx => {
      const keys = Object.keys(idx.key);
      return keys.length === 2 
        && keys.includes('studentId') 
        && keys.includes('eventId') 
        && idx.unique === true;
    });

    if (oldIndex) {
      console.log(`[MIGRATION] Dropping old index "${oldIndex.name}" { studentId: 1, eventId: 1 }...`);
      await collection.dropIndex(oldIndex.name);
      console.log('[MIGRATION] Old index dropped successfully. New { studentId, eventId, topic } index will be created by Mongoose.');
    } else {
      console.log('[MIGRATION] No old { studentId, eventId } unique index found. Nothing to migrate.');
    }
  } catch (error) {
    // If the collection doesn't exist yet, or any other non-critical error
    if (error.codeName === 'NamespaceNotFound') {
      console.log('[MIGRATION] Registrations collection does not exist yet. Skipping migration.');
      return;
    }
    console.error('[MIGRATION] Error during index migration:', error.message);
  }
}

module.exports = { migrateRegistrationIndex };
