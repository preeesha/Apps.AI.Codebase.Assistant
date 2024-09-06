import {
    IPersistence,
    IPersistenceRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";

/**
 * Persists UI data using the provided persistence handler.
 *
 * @template T - The type of the data being persisted.
 * @param {IPersistence} persistence - The persistence handler to use for data storage.
 * @param {string} id - The identifier for the data being persisted.
 * @param {T} data - The data to be persisted.
 * @returns {Promise<void>} - A promise that resolves when the data has been successfully persisted.
 */
export const persistUIData = async <T>(
    persistence: IPersistence,
    id: string,
    data: T
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    await persistence.updateByAssociation(association, data as any, true);
};

/**
 * Retrieves UI data from the persistence layer based on the provided ID.
 *
 * @template T - The type of the UI data to be retrieved.
 * @param {IPersistenceRead} persistenceRead - The persistence read instance used to retrieve data.
 * @param {string} id - The ID used to identify the UI data.
 * @returns {Promise<T | null>} - A promise that resolves to the retrieved UI data or null if not found.
 */
export const getUIData = async <T>(
    persistenceRead: IPersistenceRead,
    id: string
): Promise<T | null> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    const result = (await persistenceRead.readByAssociation(
        association
    )) as Array<any>;
    return result && result.length ? (result[0] as any) : null;
};

/**
 * Clears the UI data associated with a specific ID.
 *
 * @param {IPersistence} persistence - The persistence object used for data storage.
 * @param {string} id - The ID of the data to be cleared.
 * @returns {Promise<void>} - A promise that resolves when the UI data is cleared.
 */
export const clearUIData = async (
    persistence: IPersistence,
    id: string
): Promise<void> => {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.USER,
        `${id}#UI`
    );
    await persistence.removeByAssociation(association);
};
