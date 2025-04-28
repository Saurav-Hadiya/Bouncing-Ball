import BounceBallCanvas from "@/components/BounceBallCanvas";

export default function Home() {
  return (
    <div className="flex justify-center items-center">
        <BounceBallCanvas canvasWidth={600} canvasHeight={400} />
    </div>
)
}
