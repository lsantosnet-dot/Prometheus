import type { MeasurementPhoto } from '../domain/models'

export type PreparedMeasurementPhoto = Omit<MeasurementPhoto, 'id' | 'measurementId' | 'createdAt'>

const maximumDimension = 1600
const jpegQuality = 0.82

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('The selected image could not be opened.'))
    }
    image.src = url
  })
}

function canvasToJpeg(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The image could not be processed.')), 'image/jpeg', jpegQuality)
  })
}

export async function prepareMeasurementPhoto(file: File): Promise<PreparedMeasurementPhoto> {
  const image = await loadImage(file)
  const scale = Math.min(1, maximumDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image processing is not supported by this browser.')
  context.fillStyle = '#FFFFFF'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)
  const blob = await canvasToJpeg(canvas)

  return {
    blob,
    fileName: `${file.name.replace(/\.[^.]+$/, '') || 'measurement-photo'}.jpg`,
    mimeType: 'image/jpeg',
    width,
    height,
    size: blob.size,
  }
}