# GREEN-API implementation notes

## API host

GREEN-API publishes `apiUrl`, `idInstance` and `apiTokenInstance` in the instance console. The UI automatically suggests the current MAX v3 cluster-style URL based on the beginning of `idInstance`, but the `apiUrl` field is always editable and the console value is authoritative.

## New chat by phone number

The MAX documentation recommends resolving a phone number to a persistent `chatId` using `CheckAccount`, then sending messages by `chatId`.

Endpoint:

```text
POST {apiUrl}/waInstance{idInstance}/checkAccount/{apiTokenInstance}
```

Body:

```json
{ "phoneNumber": 79991234567 }
```

The method currently accepts Russian and Belarusian numbers.

## Send text

```text
POST {apiUrl}/waInstance{idInstance}/sendMessage/{apiTokenInstance}
```

```json
{
  "chatId": "10000000",
  "message": "Hello"
}
```

## Receive text

The client continuously calls:

```text
GET {apiUrl}/waInstance{idInstance}/receiveNotification/{apiTokenInstance}?receiveTimeout=5
```

When a notification is processed, it acknowledges it with:

```text
DELETE {apiUrl}/waInstance{idInstance}/deleteNotification/{apiTokenInstance}/{receiptId}
```

For the test task, the UI renders only incoming text-compatible notification types and intentionally skips media.
