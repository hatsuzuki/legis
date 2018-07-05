from bs4 import BeautifulSoup
import requests

page = requests.get("https://sso.agc.gov.sg/Act/CPC2010?ProvIds=Sc1-#Sc1-")
soup = BeautifulSoup(page.text, 'html.parser')

x = soup.find("tr", {"id":"Sc1-s1-s22-ta-tr-oc1-"})
print(type(x))