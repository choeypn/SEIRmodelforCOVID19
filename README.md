# Project2-CSCI474

Research project for WWU's CSCI 474 Bioinformatics course regarding the correlation of social distancing measures, age, and health conditions on the spread and impact of the virus on a population.

## Usage:
`python3 modelV3.py`

To see optional command line arguments:
`python3 modelV3.py -h`

## Model Program Requirements:
- Python 3.7.2 or greater
- R0.txt file formatted as follows:
```
day=0 R0=float
day=int R0=float
...
day=int R0=float
```
note: The int given to the first day must be 0. The int given to the last day must be 365 or greater. There can be any number days and R0 values between.
