"use client";

type Props = {
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function ImageUploader({
  accept = "image/*",
  onChange,
}: Props) {
  return (
    <input
      type="file"
      accept={accept}
      onChange={onChange}
      style={{
        marginBottom: "20px",
      }}
    />
  );
}