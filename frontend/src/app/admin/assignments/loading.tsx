import { HashLoader } from "react-spinners";

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <HashLoader color="#AB58E7" size={50} />
    </div>
  );
}

