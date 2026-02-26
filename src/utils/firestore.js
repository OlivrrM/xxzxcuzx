import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import {
  photographySchema,
  softwareSchema,
  gamesSchema,
} from '../schemas';

const schemaMap = {
  photography: photographySchema,
  software: softwareSchema,
  games: gamesSchema,
};

/**
 * Validate an object against the appropriate Zod schema and add it to
 * the named collection. Throws if validation fails or the add operation
 * fails.
 *
 * @param {string} collectionName
 * @param {object} data
 * @returns {Promise<import('firebase/firestore').DocumentReference>}
 */
export async function addItem(collectionName, data) {
  const schema = schemaMap[collectionName];
  if (schema) {
    schema.parse(data);
  }
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, data);
  return docRef;
}
