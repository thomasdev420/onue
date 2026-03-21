/**
 * Event names for the selection pipeline (queue integration later: RabbitMQ/BullMQ).
 */
export const AmplySelectionEvents = {
  PRODUCT_INGESTED: 'ProductIngested',
  SCAN_REQUESTED: 'ScanRequested',
  SCAN_COMPLETED: 'ScanCompleted',
  ACTION_APPLIED: 'ActionApplied',
};
