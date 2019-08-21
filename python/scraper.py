'''
    Web scraper for First Schedule, Criminal Procedure Code (Cap. 68)

    by Hatsuzuki (http://hatsuzuki.github.io)
    2018-07-06

    Grabs table of Penal Code Offences from AGC's website,
    cleans up the code (removes headers and formats "Ditto" cells)
    then writes the cleaned result to a JSON file
'''

# dependencies
from bs4 import BeautifulSoup
import requests
import json


# constants
PAGE_URL = "https://sso.agc.gov.sg/Act/CPC2010?ProvIds=Sc1-#Sc1-"
MAIN_TABLE_ID = "Sc1-s1-s22-ta-"
CONTENT_CELL_CLASS = "fs"
FILE_PATH = ""


# main result lists
offences = []
offences_json = []


# read scraped site contents from text file python/page.txt
# if file not found, re-scrape from PAGE_URL and save into python/page.txt
try:
    page = open("page.txt", "r").read()

except FileNotFoundError:
    page = requests.get(PAGE_URL).text
    f = open(FILE_PATH + "page.txt", "w+")
    f.write(page)
    f.close()


# parse page using BeautifulSoup
soup = BeautifulSoup(page, "html.parser")


# find the specific element containing the content that we want in the page
table = soup.find("td", {"id":MAIN_TABLE_ID}).find("table").find("tbody")


# iterate through each element (i.e. row) in table,
# grab the contents of each cell in the row,
# and append it to offences
for row in table: 
    row_result = []

    row_data = row.find_all("td", {"class": CONTENT_CELL_CLASS})
    
    for cell in row_data:
        row_result.extend(cell.strings)

    # some rows have length of 9 because e.g. "304(a)" is
    # wrongly interpreted as ["304(", "a", ")""]
    # so we have to merge them back into one element
    if len(row_result) == 9:
        row_result[0:3] = ["".join(row_result[0:3])]

    # a valid row should have length of exactly 7
    # if length != 7, it will be removed
    # but print it first just in case
    if len(row_result) != 7:
        print(row_result)

    offences.append(row_result)


# start from offences[2:] to remove header rows
# filter for len(i) == 7 to remove invalid rows
offences = [i for i in offences[2:] if len(i) == 7]


# iterate through entire table to remove dittos
# if cell content == "Ditto", replace it with contents of the cell in the previous row
for row_index in range(len(offences)):

    for cell_index in range(len(offences[row_index])):
        if offences[row_index][cell_index] == "Ditto":
            offences[row_index][cell_index] = offences[row_index-1][cell_index]


# convert offences into a properly-labelled dictionary
for i in offences:
    if (len(i) == 1):
        chap = i.split(" — ")
        print(chap)
        continue

    r = {
            "statute"       :   "224",
            "statute_name"  :   "Penal Code",
            "section"       :   i[0],
            "offence"       :   i[1],
            "arrestable"    :   i[2],
            "warrant"       :   i[3],
            "bailable"      :   i[4],
            "punishment"    :   i[5]
        }
    offences_json.append(r)


# write to JSON file
f = open(FILE_PATH + "cpc.json", "w")
f.write(json.dumps(offences_json, indent=4, separators=(",", ": ")))
f.close()


# print status
print()
print("done: %s entries processed" % len(offences))
print()