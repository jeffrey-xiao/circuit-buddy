from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
from qm import QM
from openCv import cvFunction
from werkzeug import secure_filename
import os

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

app = Flask(__name__, static_url_path='/s')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def home():
    return redirect('/s/index.html')

@app.route("/scan", methods=['POST'])
def scan():
	if 'file' not in request.files:
		return '{"error": "Please add a file"}'
	file = request.files['file']
	if file.filename == '':
		return '{"error": "Please select a file"}'
	if file and allowed_file(file.filename):
		filename = secure_filename(file.filename)
		filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename);
		file.save(filepath)
		result = jsonify(cvFunction(filepath)) 
		os.remove(filepath)
		return result

@app.route("/kmap", methods=['POST'])
def kmap():
	data=request.get_json(force=True)	
	print(data)

	length=len(data)
	N=0
	while(length>0):
		N+=1
		length/=2
	N-=1
	print N
	arrInputs=[]
	for i in range(0, N):
		arrInputs.append(str(i))
	print arrInputs
	qm = QM(arrInputs);
	hold=[]
	for i in range (len(data)):
		if(int(data[i][N])==1):
			hold.append(i)
	
	minimized=qm.get_function(qm.solve(hold,[])[1])
	print minimized
	
 	return jsonify(minimized)

# cvFunction(img url)
	
if __name__ == "__main__":
    app.run(debug=True, port = int(os.environ.get('PORT', 5000)))