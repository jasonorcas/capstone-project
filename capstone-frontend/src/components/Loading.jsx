// ---------------------------
// Loading Component
// - Shows loading spinner or text
// ---------------------------
export default function Loading() {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "2rem",
                minHeight: "200px",
            }}
        >
            <div style={{ fontSize: "18px", color: "#666" }}>Loading...</div>
        </div>
    );
}
