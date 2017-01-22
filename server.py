from flask import Flask, request, jsonify, send_from_directory, redirect, url_for
from qm import QM
import os


app = Flask(__name__, static_url_path='/s')


@app.route('/')
def home():
    return redirect('/s/index.html')

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