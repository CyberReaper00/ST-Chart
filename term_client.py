import imaplib
import email
from email.policy import default

# Gmail IMAP server details
server = 'imap.gmail.com'
port = 993  # For SSL connection

# Credentials
username = 'simple.nahyan@gmail.com'
password = 'fsyu dobj wbaj pkuq'  # Use the app password

# Connect to the Gmail IMAP server
connection = imaplib.IMAP4_SSL(server, port)

# Log in with your credentials
connection.login(username, password)

# Select the mailbox you want to access (INBOX in this case)
connection.select('INBOX')

# Search for emails with the specific subject
status, ids = connection.search(None, '(UNSEEN SUBJECT "Alert: iopiop")')
ids = ids[0].split()

# Prepare a dictionary to hold the data from each email
email_data = {'email1': [], 'email2': [], 'email3': [], 'email4': []}
file_name = input('Please input name of file: ')
# Loop through the email IDs and fetch the emails
for idx, email_id in enumerate(ids):
    status, data = connection.fetch(email_id, '(RFC822)')
    raw = data[0][1]
    msg = email.message_from_bytes(raw, policy=default)

    # Extract the content of the email
    email_content = []
    if msg.is_multipart():
        for part in msg.walk():
            if part.get_content_type() == 'text/plain':
                email_content = part.get_payload(decode=True).decode('utf-8').splitlines()
    else:
        email_content = msg.get_payload(decode=True).decode('utf-8').splitlines()
        # Categorize based on the first line
    if email_content:
        first_line = email_content[0].strip().lower()

        if first_line == "date":
            email_data['email1'].extend(email_content[1:])  # Collect all lines after the first
        elif first_line == "time":
            email_data['email2'].extend(email_content[1:])  # Collect all lines after the first
        elif first_line == "value":
            email_data['email3'].extend(email_content[1:])  # Collect all lines after the first
        elif not first_line:
            email_data['email4'].extend(email_content[1:])  # Collect all lines after the first


# Prepare the combined data
max_lines = max(len(content) for content in email_data.values())  # Get the longest email content length

combined_data = []
combined_data.append('data,value')

# Combine the data line by line
email1_data = email_data['email1']
email2_data = email_data['email2']
email3_data = email_data['email3']

for i in range(max_lines):
    row = []
    if i < len(email1_data):
        row.append(email1_data[i])
    if i < len(email2_data):
        row.append(email2_data[i])
    if i < len(email3_data):
        row.append(email3_data[i])

    if len(row) > 0:
        combined_row = f"{row[0]} | {row[1]},{row[2]}" if len(row) == 3 else ' '.join(row)
        combined_data.append(combined_row)

for i in range(max_lines):
    if i < len(email_data['email4']):
        combined_data.append(email_data['email4'][i])

# Write the combined data to a text file in the same directory
with open(f"{file_name}.csv", 'w') as f:
    for line in combined_data:
        f.write(line + '\n')

# Log out from the server
connection.logout()

print('Data has been combined')

