export default function AssistantAvatar() {
  return (
    <div className="h-11 w-11 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(34,211,238,0.25)]">
      <img
        src="/assistant-avatar.png"
        alt="Assistant"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
