# Circuit-Analysis
## Overview
A simple digital circuits toolbox that has an intuitive UI. Designed for students studying digital circuits. Built by Jeffrey Xiao,
Kevin Pei, Nick Bo, and Daniel Tong. Circuit Buddy was a top 30 finalist at PennApps XV Ad Astra.

Features:
 - Auto-updating truth table
 - Multiple tabs
 - Importing and exporting with text or images
 - Circuit simplification with the Quine–McCluskey algorithm

The backend is a simple flask server that handles the endpoints for openCV and the Quine-McCluskey algorithm. The frontend
is mainly vanilla javascript built on [FabricJS](http://fabricjs.com/) and jQuery for the tabs.

Try it now: http://circuit-buddy.herokuapp.com/s/index.html

## Local installation
To run it locally:
* Clone the repository
* Install openCV for python 2.7
* Run the server with ```python server.py```

## Structure
Logic for the quine-mcluskey algorithm is handled in [qm.py](/qm.py) and openCV in [openCv.py](/openCv.py). The structure and logic for the circuit builder
is located under [main.js](/static/js/main.js).
