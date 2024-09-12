import { ButtonStyle } from "@rocket.chat/apps-engine/definition/uikit"
import { ToggleSwitchElement } from "@rocket.chat/ui-kit"

import {
   ActionsBlock,
   ButtonElement,
   CheckboxElement,
   ContextBlock,
   DividerBlock,
   InputBlock,
   MultiStaticSelectElement,
   Option,
   SectionBlock,
   StaticSelectElement,
} from "@rocket.chat/ui-kit"
import { APP_ID } from "../constants"

/**
 * Creates an input block with a label and a plain text input element.
 *
 * @param labelText - The text to be displayed as the label for the input block.
 * @param placeholderText - The text to be displayed as the placeholder for the plain text input element.
 * @param blockId - The unique identifier for the input block.
 * @param actionId - The unique identifier for the action associated with the input block.
 * @param initialValue - The initial value to be displayed in the plain text input element (optional).
 * @param multiline - A boolean value indicating whether the plain text input element should support multiple lines (optional).
 *
 * @returns A promise that resolves to an InputBlock object representing the created input block.
 */
export async function getInputBox(
   labelText: string,
   placeholderText: string,
   blockId: string,
   actionId: string,
   initialValue?: string,
   multiline?: boolean
): Promise<InputBlock> {
   const block: InputBlock = {
      type: "input",
      label: {
         type: "plain_text",
         text: labelText,
      },
      element: {
         type: "plain_text_input",
         placeholder: {
            type: "plain_text",
            text: placeholderText,
         },
         appId: APP_ID,
         blockId,
         actionId,
         initialValue,
         multiline,
      },
   }
   return block
}

/**
 * Creates an input block with a datepicker element.
 *
 * @param labelText - The label text for the input block.
 * @param placeholderText - The placeholder text for the datepicker element.
 * @param blockId - The ID of the block.
 * @param actionId - The ID of the action.
 * @param initialDate - The initial date for the datepicker element (optional).
 * @returns A promise that resolves to an InputBlock object.
 */
export async function getInputBoxDate(
   labelText: string,
   placeholderText: string,
   blockId: string,
   actionId: string,
   initialDate?: string
): Promise<InputBlock> {
   const block: InputBlock = {
      type: "input",
      label: {
         type: "plain_text",
         text: labelText,
      },
      element: {
         type: "datepicker",
         placeholder: {
            type: "plain_text",
            text: placeholderText,
         },
         appId: APP_ID,
         blockId,
         actionId,
         initialDate,
      },
   }
   return block
}

/**
 * Creates a button element with the specified properties.
 * @param labelText - The text to be displayed on the button.
 * @param blockId - The ID of the block containing the button.
 * @param actionId - The ID of the action associated with the button.
 * @param value - The optional value associated with the button.
 * @param style - The optional style of the button. Can be either ButtonStyle.PRIMARY or ButtonStyle.DANGER.
 * @param url - The optional URL to be opened when the button is clicked.
 * @returns A promise that resolves to a ButtonElement.
 */
export async function getButton(
   labelText: string,
   blockId: string,
   actionId: string,
   value?: string,
   style?: ButtonStyle.PRIMARY | ButtonStyle.DANGER,
   url?: string
): Promise<ButtonElement> {
   const button: ButtonElement = {
      type: "button",
      text: {
         type: "plain_text",
         text: labelText,
      },
      appId: APP_ID,
      blockId,
      actionId,
      url,
      value,
      style,
   }
   return button
}

/**
 * Creates a section block for a Slack message.
 *
 * @param labelText - The label text to be displayed in the section block.
 * @param accessory - An optional accessory to be included in the section block.
 * @returns A promise that resolves to a SectionBlock object.
 */
export async function getSectionBlock(labelText: string, accessory?: any): Promise<SectionBlock> {
   const block: SectionBlock = {
      type: "section",
      text: {
         type: "plain_text",
         text: labelText,
      },
      accessory,
   }
   return block
}

/**
 * Retrieves a DividerBlock.
 *
 * @returns A Promise that resolves to a DividerBlock object.
 */
export async function getDividerBlock(): Promise<DividerBlock> {
   const block: DividerBlock = {
      type: "divider",
   }
   return block
}

/**
 * Creates a context block with the specified element text.
 * @param elementText - The text to be displayed in the context block.
 * @returns A Promise that resolves to a ContextBlock object.
 */
export async function getContextBlock(elementText: string): Promise<ContextBlock> {
   const block: ContextBlock = {
      type: "context",
      elements: [
         {
            type: "plain_text",
            text: elementText,
         },
      ],
   }
   return block
}

/**
 * Creates a static select element for Slack app.
 *
 * @param placeholderText - The placeholder text to be displayed in the select element.
 * @param options - An array of options for the select element.
 * @param blockId - The ID of the block containing the select element.
 * @param actionId - The ID of the action associated with the select element.
 * @param initialValue - The initial value for the select element (optional).
 *
 * @returns A promise that resolves to a StaticSelectElement object.
 */
export async function getStaticSelectElement(
   placeholderText: string,
   options: Array<Option>,
   blockId: string,
   actionId: string,
   initialValue?: Option["value"]
): Promise<StaticSelectElement> {
   const block: StaticSelectElement = {
      type: "static_select",
      placeholder: {
         type: "plain_text",
         text: placeholderText,
      },
      options,
      appId: APP_ID,
      blockId,
      actionId,
      initialValue,
   }
   return block
}

/**
 * Retrieves an Option object with the provided text and value.
 *
 * @param {string} text - The text to be displayed for the option.
 * @param {string} value - The value associated with the option.
 * @returns {Promise<Option>} - A Promise that resolves to an Option object.
 */
export async function getOptions(text: string, value: string): Promise<Option> {
   const block: Option = {
      text: { type: "plain_text", text },
      value,
   }
   return block
}

/**
 * Retrieves an ActionsBlock with the specified blockId and elements.
 *
 * @param blockId - The unique identifier for the ActionsBlock.
 * @param elements - An array of ButtonElement, StaticSelectElement, or MultiStaticSelectElement objects.
 * @returns A Promise that resolves to an ActionsBlock.
 */
export async function getActionsBlock(
   blockId: string,
   elements: Array<ButtonElement> | Array<StaticSelectElement> | Array<MultiStaticSelectElement>
): Promise<ActionsBlock> {
   const block: ActionsBlock = {
      type: "actions",
      blockId,
      elements,
   }
   return block
}

/**
 * Retrieves a multi-static select element with the specified placeholder text, options, block ID, and action ID.
 *
 * @param placeholderText - The text to be displayed as a placeholder in the multi-static select element.
 * @param options - An array of options for the multi-static select element.
 * @param blockId - The ID of the block containing the multi-static select element.
 * @param actionId - The ID of the action associated with the multi-static select element.
 * @returns A promise that resolves to a MultiStaticSelectElement object.
 */
export async function getMultiStaticElement(
   placeholderText: string,
   options: Array<Option>,
   blockId: string,
   actionId: string
): Promise<MultiStaticSelectElement> {
   const block: MultiStaticSelectElement = {
      type: "multi_static_select",
      placeholder: {
         type: "plain_text",
         text: placeholderText,
      },
      options,
      appId: APP_ID,
      blockId,
      actionId,
   }
   return block
}

/**
 * Retrieves a checkbox element with the specified options, initial options, block ID, and action ID.
 *
 * @param options - An array of options for the checkbox element.
 * @param initialOptions - An array of initial options selected for the checkbox element.
 * @param blockId - The ID of the block containing the checkbox element.
 * @param actionId - The ID of the action associated with the checkbox element.
 * @returns A promise that resolves to a CheckboxElement object.
 */
export async function getCheckBoxElement(
   options: Array<Option>,
   initialOptions: Array<Option>,
   blockId: string,
   actionId: string
): Promise<CheckboxElement> {
   const block: CheckboxElement = {
      type: "checkbox",
      options,
      initialOptions,
      appId: APP_ID,
      blockId,
      actionId,
   }
   return block
}

/**
 * Retrieves a toggle switch element with the specified options, initial options, block ID, and action ID.
 *
 * @param options - An array of options for the toggle switch.
 * @param initialOptions - An array of initial options for the toggle switch.
 * @param blockId - The ID of the block.
 * @param actionId - The ID of the action.
 * @returns A promise that resolves to a ToggleSwitchElement.
 */
export async function getToggleSwitchElement(
   options: Array<Option>,
   initialOptions: Array<Option>,
   blockId: string,
   actionId: string
): Promise<ToggleSwitchElement> {
   const block: ToggleSwitchElement = {
      type: "toggle_switch",
      options,
      initialOptions,
      appId: APP_ID,
      blockId,
      actionId,
   }
   return block
}
