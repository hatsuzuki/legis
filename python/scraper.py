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
import re


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

# flag to highlight edge case: offences not in penal code
# (last 4 rows of table) that will not be included for consistency
other_offences_flag = 0

# iterate through each element (i.e. row) in table,
# grab the contents of each cell in the row,
# and append it to offences
for row in table: 
    row_result = []

    # skip empty rows that are just blank strings
    try:
        row_data = row.find_all("td", class_ = CONTENT_CELL_CLASS)
    except AttributeError:
        continue
    
    for cell in row_data:
        row_result.extend(cell.strings)

    # some rows have length of 9 because e.g. "304(a)" is
    # wrongly interpreted as ["304(", "a", ")""]
    # so we have to merge them back into one element
    if len(row_result) == 9:
        row_result[0:3] = ["".join(row_result[0:3])]

    # highlight and fix edge case where ["Not bailable"] is wrongly formatted
    # as ["Not", "bailable"]
    if len(row_result) == 8 and row_result[4] == "Not " and row_result[5] == "bailable":
        row_result = row_result[:4] + ["Not bailable"] + row_result[6:]
        print(row_result)

    # highlight edge case where row length == 6 (only present in last 4
    # rows of the table --- generic provisions for offences not in Penal Code)
    if len(row_result) == 6 and other_offences_flag == 0:
        print("\nOffences not in Penal Code (omitted):")
        other_offences_flag = 1

    # a valid row should have length of exactly 7
    # if length != 7, it will be removed
    # but print it first just in case
    if len(row_result) != 7:
        print(row_result)

    offences.append(row_result)


# filter for len(i) == 7 to remove invalid rows
offences = [i for i in offences if len(i) == 7]


# no longer required -- dittos have been removed entirely
# # iterate through entire table to remove dittos
# # if cell content == "Ditto", replace it with contents
# # of the cell in the previous row
# for row_index in range(len(offences)):

#     for cell_index in range(len(offences[row_index])):
#         if offences[row_index][cell_index] == "Ditto":
#             offences[row_index][cell_index] = offences[row_index-1][cell_index]


# convert offences into a properly-labelled dictionary
for i in offences:
    if (len(i) == 1):
        chap = i.split(" — ")
        print(chap)
        continue

    # replace weird characters and trim spaces
    for n in range(6):
        i[n] = i[n].replace(u"\u00A0", " ")
        i[n] = i[n].replace(u"\u2011", "-")
        i[n] = i[n].replace(u"\u2014", "-")
        i[n] = i[n].replace(u"\u2019", "'")
        i[n] = i[n].replace("\n", "")
        i[n] = i[n].replace("Fine*", "Fine")
        i[n] = i[n].replace("fine*", "fine")
        i[n] = i[n].strip()
        i[n] = re.sub("  +", "", i[n])

    r = {
            "statute"       :   "Penal Code 1871",
            "section"       :   i[0],
            "offence"       :   i[1],
            "arrestable"    :   i[2],
            "warrant"       :   i[3],
            "bailable"      :   i[4],
            "punishment"    :   i[5]
        }
    offences_json.append(r)


# write to JSON file
f = open(FILE_PATH + "pc.json", "w")
f.write(json.dumps(offences_json, indent=4, separators=(",", ": ")))
f.close()


# print status
print("\n\ndone: %s entries processed\n\n" % len(offences))
