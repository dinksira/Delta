/**
 * CustomParameterModal Types
 * Type definitions for CustomParameterModal component.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CustomParameterModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler when modal is closed */
  onClose: () => void;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CustomParameterModalProps;
