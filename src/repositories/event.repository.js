const Event = require('../models/event.model');

class EventRepository {
  /**
   * Finds the first active event.
   */
  async findActiveEvent() {
    return await Event.findOne({ status: 'Active' });
  }

  /**
   * Finds an event by its ID.
   * @param {string} id 
   */
  async findById(id) {
    return await Event.findById(id);
  }

  /**
   * Finds an event by title, or creates it as 'Active' if it does not exist.
   * @param {string} title 
   */
  async findOrCreateEventByTitle(title) {
    let event = await Event.findOne({ title });
    if (!event) {
      event = await Event.create({ title, status: 'Active' });
    }
    return event;
  }
}

module.exports = new EventRepository();
