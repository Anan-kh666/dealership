/**
 * Reference-number helpers now live in `@dealership/types` so the web app
 * (account pages, trade-in tracker, admin) formats them identically.
 */
export {
  financingReferenceFromId,
  testDriveReferenceFromId,
  tradeInIdSuffixFromReference,
  tradeInReferenceFromId,
} from "@dealership/types";
