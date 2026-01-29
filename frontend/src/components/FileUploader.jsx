export default function FileUploader({ onUpload }) {
    return (
        <input type="file" onChange={(e) => onUpload(e.target.files[0])} />
    );
}