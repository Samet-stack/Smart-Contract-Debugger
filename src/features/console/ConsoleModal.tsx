import Modal from "../../ui-lib/components/Modal";
interface ConsoleModalProps {
    isOpen: boolean;
    onClose: () => void;
}
/** Console Modal (Upcoming Feature). Displays placeholder. */
export default function ConsoleModal({ isOpen, onClose }: ConsoleModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Console"
            className="max-w-3xl"
        >
            <div className="h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950 p-4 font-mono text-xs text-gray-500 shadow-inner">
                <div className="text-gray-400">&gt; Waiting for transaction...</div>
            </div>
        </Modal>
    );
}