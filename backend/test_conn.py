from pymongo import MongoClient

p = "C:/Users/sarang/Desktop/Error 401/backend/.env"
raw = open(p, encoding="utf-8").read()
base = raw.split("=", 1)[1].strip()

trials = {
    "plain": base,
    "tlsAllowInvalidCertificates=true": base + "&tlsAllowInvalidCertificates=true",
    "tls=false": base + "&tls=false",
    "tlsAllowInvalidCertificates=true&tlsInsecure=true": base + "&tlsAllowInvalidCertificates=true&tlsInsecure=true",
}

for label, uri in trials.items():
    try:
        c = MongoClient(uri, serverSelectionTimeoutMS=8000)
        c.admin.command("ping")
        print(f"OK   -> {label}")
        c.close()
    except Exception as e:
        msg = str(e).split(",")[-1].strip()[:90]
        print(f"FAIL -> {label}: {msg}")