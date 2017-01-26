import cv2, imutils
import numpy as np

class Shaper:
  def __init__(self):
    pass
  def detect(self, c):
    shape = "unknown"
    perimeter = cv2.arcLength(c, True)
    approximations = cv2.approxPolyDP(c, 0.03 * perimeter, True)
    if len(approximations) == 3:
      print("triangle")
      return("triangle")
    elif len(approximations) == 4:
      print("rectangle")
      return("rectangle")
    elif len(approximations) == 5:
      print("pentagon")
      return "pentagon"
    elif len(approximations) > 4:
      print("other")
      return("other")
def cvFunction(image):
  img = cv2.imread(image)
  small = imutils.resize(img, width=275)
  ratio = img.shape[0]/float(small.shape[0])

  gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
  blurred = cv2.GaussianBlur(gray, (5, 5), 0)
  #thresh = cv2.threshold(blurred, 60, 255, cv2.THRESH_BINARY)[1]
  thresh = cv2.adaptiveThreshold(blurred,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,\
              cv2.THRESH_BINARY,11,2)

  lower = np.array([0, 0, 0])
  upper = np.array([50, 50, 50])
  shapeMask = cv2.inRange(small, lower, upper)

  sd = Shaper()

  cnts = cv2.findContours(shapeMask.copy(), cv2.RETR_EXTERNAL,
    cv2.CHAIN_APPROX_SIMPLE)

  cnts = cnts[0] if imutils.is_cv2() else cnts[1]

  shapes = []

  for c in cnts:
    # compute the center of the contour, then detect the name of the
    # shape using only the contour
    M = cv2.moments(c)
    if M["m00"] > 0:
      cX = int((M["m10"] / M["m00"]) * ratio)
      cY = int((M["m01"] / M["m00"]) * ratio)
      shape = sd.detect(c)

      shapes.append([shape, (cX, -cY)])
     
      # multiply the contour (x, y)-coordinates by the resize ratio,
      # then draw the contours and the name of the shape on the image
      c = c.astype("float")
      c *= ratio
      c = c.astype("int")
      cv2.drawContours(img, [c], -1, (0, 255, 0), 2)
      cv2.putText(img, shape, (cX, cY), cv2.FONT_HERSHEY_SIMPLEX,
        0.5, (255, 255, 255), 2)
     
      # show the output image
      #cv2.imshow('threshold', shapeMask)
      #cv2.imshow("Image", img)
      #cv2.waitKey(0)
  try:
    inputs = []
    outputs = []

    shapes = sorted(shapes, key=lambda x: x[1])
    print(shapes)

    counter = 0

    for i in shapes:
      if i[0] == 'rectangle':
        inputs.append(str(len(inputs)))
      elif i[0] == 'triangle':
        inputs.append("(" + inputs.pop(0) + "*" + inputs.pop(0) + ")")
      elif i[0] == 'pentagon':
        inputs.append("(" + inputs.pop(0) + "+" + inputs.pop(0) + ")")
    print(inputs);
    return(inputs[0])
  except:
    return("")
