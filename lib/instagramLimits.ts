/**
 * Instagram platform limits for LogicDM automation fields.
 * Used for DM content, public comments, trigger keywords, and button text.
 * @see https://help.instagram.com/436248864916865
 */

/** Maximum characters per Instagram direct message (safe for mobile & API). */
export const INSTAGRAM_DM_MAX_CHARS = 1000;

/** Maximum characters per Instagram public comment (posts, Reels, IGTV). */
export const INSTAGRAM_PUBLIC_COMMENT_MAX_CHARS = 2200;

/** Maximum number of trigger keywords per automation (product limit). */
export const INSTAGRAM_TRIGGER_KEYWORDS_MAX_COUNT = 50;

/** Maximum characters per single trigger keyword. */
export const INSTAGRAM_TRIGGER_KEYWORD_MAX_LENGTH = 100;

/** Maximum characters for quick reply / CTA button text on Instagram. */
export const INSTAGRAM_BUTTON_TEXT_MAX_CHARS = 20;

/** Recommended average length for comments/DMs (better engagement, less truncation). */
export const INSTAGRAM_RECOMMENDED_CHARS = 140;
