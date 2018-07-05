# ditto.py
# Converts all "Ditto" values tabulated in the First Schedule of the Criminal Procedure Code (Cap. 68)
# to the proper preceding value, for the purposes of reference in a database


# Settings for filenames
    # orig_filename: File with original values, copied directly from the table
    # new_filename:  File with converted values, to be copied into the database

orig_filename = "ditto_arrestable.txt"
new_filename = "lapras_arrestable.txt"


# Settings for renaming of values
    # Renames original values (i.e. "May arrest without warrant") to a simpler
    # form (i.e. "Yes") for the purposes of easier programming
    # in the "rename" function below

    # positive/negative: expected original value
    # yes/no: values to be renamed into

positive = "May arrest without warrant"
negative = "Shall not arrest without warrant"

yes = "Yes"
no  = "No"


# Creates initial variables
ditto = []
lapras = []
flag = ""


# Opens and reads from file (each line = 1 new item in the array)
with open(orig_filename) as f:
    ditto = open(orig_filename).read().splitlines()


# First item should not be "Ditto"; throw an error and take NFA if it is
if ditto[0] == "Ditto":
    print("First value invalid")
    quit()


# Rename function
    # Renames original values (i.e. "May arrest without warrant") to a simpler
    # form (i.e. "Yes") for the purposes of easier programming
    # If rename values not preset, defaults to returning the original value
def rename(orig):
    if orig == positive:
        return yes
    elif orig == negative:
        return no
    else:
        return orig


# For loop that first renames values according to the settings defined above,
# then converts all dittos into the proper preceding values
for item in ditto:
    if item != "Ditto": # This value is NOT a ditto
        flag = item # Sets a flag for all subsequent dittos until a new non-ditto appears
        lapras.append(rename(item)) # Not a ditto, so copy directly (after renaming if applicable)
    else: # This value is a ditto
        lapras.append(rename(flag)) # Convert into the flag


# Writes the converted values into a new file
nfile = open(new_filename, "w")
nfile.truncate() # Erases the file contents first
for item in lapras:
    nfile.write("%s\n" % item)

print("Done")
