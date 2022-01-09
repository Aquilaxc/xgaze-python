var imageData
var canvasCtx
var videoElement
var canvasElement
const normalized_distance = 0.6
const camera_params = "./sample_params.yaml"
const normalized_camera_params  = "./eth-xgaze.yaml"
const main_camera = new CameraObj(camera_params)
const normalized_camera = new CameraObj(normalized_camera_params)
const face_model_3d = new FaceModelMediaPipe()
const head_pose_normalizer = new HeadPoseNormalizer(main_camera, normalized_camera, normalized_distance)
const jsonPath =  "dist/canonical_face_points.json"
const image_size = new cv.Size(640,480);
async function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    imageData = canvasCtx.getImageData(0, 0, image_size.width, image_size.height);
    if (results.multiFaceLandmarks) {
        for (const landmarks of results.multiFaceLandmarks) {
            face = detect_faces_mediapipe(landmarks, image_size.width, image_size.height)
            face = face_model_3d.estimate_head_pose(face, main_camera)
            face = face_model_3d.compute_3d_pose(face)
            face = face_model_3d.compute_face_eye_centers(face)
            face = head_pose_normalizer.normalize(imageData, face)
            cv.imshow('cvCanvas',face.normalized_image)
        }
    }
}

const faceMesh = new FaceMesh({locateFile: (path) => {
    return `dist/${path}`
}})

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
})

faceMesh.onResults(onResults);

async function Run(){
    videoElement = document.getElementsByClassName('input_video')[0];
    canvasElement = document.getElementsByClassName('output_canvas')[0];
    canvasCtx = canvasElement.getContext('2d');
    const camera = new Camera(videoElement, {
        onFrame: async () => {
          await faceMesh.send({image: videoElement});
        },
        width: image_size.width,
        height: image_size.height
      });
      camera.start();
}
Run()
