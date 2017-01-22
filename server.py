from flask import Flask, request, jsonify, send_from_directory, redirect
from qm import QM
import os


app = Flask(__name__, static_url_path='/s')


@app.route('/')
def hello():
    return redirect(url_for('s/index.html'))

@app.route("/kmap", methods=['POST'])
def kmap():
	data = request.get_json(force=True)
	#print(data)
	N=int(data["inputs"])
	print(data)
	arrInputs=[]
	for i in range(0, N):
		arrInputs.append(str(i))
	print arrInputs
	qm = QM(arrInputs);
	hold=[]
	for i in range (len(data["test"])):
		print data["test"][i][N]
		if(int(data["test"][i][N])==1):
			hold.append(i)
	print hold
	minimized=qm.get_function(qm.solve(hold,[])[1])
	return jsonify(minimized)


if __name__ == "__main__":
    app.run(debug=True, port = int(os.environ.get('PORT', 5000)))