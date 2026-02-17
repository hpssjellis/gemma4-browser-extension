import { Modal } from "../theme";

export default function ChatToolsModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Tools" onClose={onClose}>
      test
    </Modal>
  );
}
