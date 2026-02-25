# **PRD \#2: RPG Dice Roller – Advanced Mechanics & Criticals \[DRAFT\]**

## **1\. Objective**

Extend the core dice rolling engine to support standard tabletop "Advanced Mechanics"—specifically **Exploding Dice**, **Keep/Drop logic**, and **Critical Success/Failure** detection—without adding new keys to the custom keypad. All notation must utilize existing keys: Numbers, d, Space, \-, \+, and \!.

## **2\. Exploding Dice (The \! and \!\! Operators)**

Exploding dice occur when a die rolls its maximum value, triggering an additional roll.

### **A. Notation**

* **Standard Explosion (NdX\!):** Dice explode on the maximum face value. Each exploded die is added as a new separate die in the group.  
* **Compounding Explosion (NdX\!\!):** Dice explode on the maximum face value, but the new roll is added directly to the *same* die's total (single result display).  
* **Threshold Explosion (NdX\!Y):** Dice explode on any result ![][image1].

### **B. UI Representation**

* **Standard (\!):** Exploded results are displayed in brackets within the die breakdown.  
  * *Example (2d6\! rolling 6, then 4; and 2):* 10=\[6\!+4\] 2=\[2\]  
* **Compounding (\!\!):** Shown as a single total with the explosion indicated.  
  * *Example (2d6\!\! rolling 6, then 4; and 2):* 10\!\! 2

## **3\. Filter Logic (The Symmetrical \+/- Operator)**

To maintain a minimalist keypad, we avoid letters (kh, dl). Instead, we use double-operator notation where the first symbol defines the **Action** (Keep/Drop) and the second defines the **Direction** (High/Low).

### **A. Keep Logic (+)**

* **NdX++Y (Keep High):** Keep the Y highest results.  
* **NdX+-Y (Keep Low):** Keep the Y lowest results.

### **B. Drop Logic (-)**

* **NdX-+Y (Drop High):** Drop (minus) the Y highest results.  
* **NdX--Y (Drop Low):** Drop (minus) the Y lowest results.

### **C. UI Representation**

Filtered (Dropped) dice are shown with a strikethrough in the breakdown.

* **Example (Advantage):** 2d20++1 rolling 18 and 4\.  
  * 18=\[18, \~\~4\~\~\]  
* **Example (Stat Roll):** 4d6--1 rolling 6, 5, 2, 1\.  
  * 13=\[6, 5, 2, \~\~1\~\~\]

## **4\. Critical Detection**

Provides visual flair for "Natural" results (the raw number on the die face).

### **A. Critical Success (Nat Max)**

* Triggered when a die rolls its maximum value.  
* **UI:** Result is highlighted in **Bold Green**.

### **B. Critical Failure (Nat 1\)**

* Triggered when a die rolls a 1\.  
* **UI:** Result is highlighted in **Bold Red**.

## **5\. Mathematical Hierarchy Integration**

These mechanics reside at **Level 2 (Group)** of the hierarchy and execute before Level 1 modifiers.

| Mechanic | Notation | Precedence |
| :---- | :---- | :---- |
| **Explode** | \! or \!\! | 1 (Immediate) |
| **Filter** | \++, \+-, \-+, \-- | 2 (Post-roll, Pre-sum) |
| **Modifiers** | No Space / Space | 3 (Post-sum) |
| **Limits** | Floor/Ceiling | 4 (Final Clamp) |

## **6\. Safety Rules**

* **Filter Limit:** ![][image2] must be less than ![][image3]. If ![][image4], the system defaults to keeping all.  
* **Recursion Cap:** To prevent crashes/infinite loops, explosions are capped at **20 iterations** per die.  
* **Explosion Threshold:** If ![][image5] is used, ![][image2] must be ![][image6].

## **7\. Appendix: Shorthand Reference**

* **D\&D 5e Advantage:** 2d20++1  
* **D\&D 5e Disadvantage:** 2d20+-1  
* **D\&D 5e Stats:** 4d6--1  
* **Savage Worlds (Wild Die):** 1d6\! 1d6\!  
* **Shadowrun (Rule of Six):** Nd6\!\!

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAYCAYAAACSuF9OAAABy0lEQVR4Xu2VTStEURjH7zRJIhLjNq9n3jY2UhMiG7JUFhYUKxaWvsAkC1ayQRY2Vkp2kvUQaWokG/kCsrNDIS+/x9zR7TR3Zq6RZjG/+jf3nuflPOec554xjDp1aoxkMtmqlDpCnza9oxW7XyQSmdV8LoLBYMe3kZcRlI1Go9OpVKrBHvhbYrGYSc5b9Mbkw7odPNg20bYsQjcaoVCoCeMcukbzpmk26z5uIc+qrJ6FLhexTUpBZTdAHGSncL5E6aLVVwjxg+gF5dil9sI4z2OMHcTj8Ta7fzm8BI2iM7T2c74ukAmJzSrbsXGU/byf86t0/0rxsGMDJMmgLeTXHUohx6XyTbshRcAx6tb9XMPRNbLKJZLd0W9J3e4EMSlintA9z6eyQ7qPK+zNTsJFt83u8/laiD1BH+zWlG6vGJlYCiDRVTXXgTQzOXLoJhAIdOr2slgXW1rl76UJhry6jxukX9AD2uPVo9sdIcCv8k2bQUNGlYUUINeMyt9FC7rNEbZ1nIBDGq7HcLOK8njIvUtBz+FwuE83/htW/+1TyKPsjqVXGXP7UdQG8gVZf4bSRyWVSCS6jD/qL0fon14m26lQ61KYnqNOnVrhC+2qenixo8qOAAAAAElFTkSuQmCC>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAABAklEQVR4XmNgGAUMsrKyfvLy8l+A+D8MKygo3FJSUlKDqZGRkRECip9AUvMXqCYe2RwGoGAOVHINkMuCIskAtkgHKHcGiJ2AXEZ0eQY5OTkloORzIH4CxIrIckDX8APFVikqKpohi6MDFqCi5VBXRMMExcXFuYH8OUAcjKwYKwD6KwLZG8bGxqxAl80A4jIGbM5GByCnQ73wFqhJG0iXAuk6kEHoanEBRqCG+SBXAOmDQHoyKZrBABqtoKg8BAo8dHmCAKh5EhB/Axpkii5HEACdLQjUfBqIr0pJSYmgyxMEQAOMgZq/AvFSBmJCHQaAGl2Amp6B/I6EX4HE0dWOgmEJAAC9QvRNcyAcAAAAAElFTkSuQmCC>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAABSElEQVR4XmNgGAUkAXl5eUcgfg3E/0FYTk5uh4yMDCdMXkVFhU9BQWEXTB6K14mLi3MjmwMDjEDJWUD8C4h/ArElugKgWBAQr0G2BAMAXSEItHUhkM6H2jgFKMyIrAYoVgTE0chiGEBRUVEfaEg/UKEkEF8H4idArIikhAXInw1ShySGCUA2AV2UDmID6Qaoq3Jg8lJSUiJQFwsidGEBQE19QEXGILasrKwOkP8eiE8oKSnxg8SAcjZA/mRUXWgAFj4gW6FCIG8sB+J/QHEPkADItUSHDwNS4IIMABkEMhAUSySHDwyAvATyGtSLTsSEDyj9TAaGiym6BFBjjDwk0K8BDepEl0cBWMIHDoBeEZeHJAWQYfjDB+RsIF4HNIgLXQ4EoEnhLRBrosuBAdAlLkDJL1DbQBiULbzR1YGSAijvEQqfUTAiAQBQCVhal567ggAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADsAAAAYCAYAAABEHYUrAAAC1klEQVR4Xu2WSWhUQRCG35AIiqK4jIOz9Wy4L4dBRfAkXryo4EXwIHrJJSAICkJQr+LNBBRHEA8iLnjWU1BBggbxIgHPoiiICCp4kPj9ef3GnsbJLC9GxPdD0dNV1TVV1VXVLwgSJEjwT6FQKOw3xnyBpiMqlUqvK5XK2kgnn8+vgD/h6PxA56hrZ76QzWZX8f9PHF8+EcNmV6dYLJ525KI3xLClqQBj2ArusR38dTSEDCKbhPawTflyHyTjGLrjVn/Al8eFvaTP8pn/Ou/Lc7lcHtlTZOt9mbJRQfhOWYDKroxbXgbvTrlc3uHyO6FWqy3l3Ag0wZ8erNfrC3ydfqEAoSHr7xS+ZVw5+23wG8FvLk4YRHhLmYKORMxMJrOY/TXokKvcC2SDZJ7AxkvoOCW1yNfpBZFP9vbG5DOBH3Z1FAN00uW1QAdssDOlrJvAySvqgaCL0u0E2bP/8ULBy2lfpxvYKmxgayHrLug7vAduEpFdgLfbPdcCDpVNWBYfUdzEeor17FyWn8UAzhww4dAbUbn7CrOBM/vkm34rQAWqgBW4eOyXY/+2X9o+Uihe59A06yPW0T8QaBMKEqduKGhNfF/eDupX/Nvr7KOKHGObYt2A/HLQpl+bsFNOPfBYg8mXzwWcwTUpR3tJaNSvJCcX8XSD8KaMHa6mU79GsIoKdsiXxQUDZSW2L5rwnezrSXL71eXrtuU3NNyxXyOgfAn6xg1v92X9AntrTDg1x3FkZxBj2KnysHHG53PTNey/hd4T6EN9fPg6LVBjo/wcetVRuQtQXuuwdVeE7Y1BjCAj+P3qQL068wyZNh9GLcBIHcWv0M0gpmPF8F1tGO8DJQ7o9bRujSRu9WWCsc/QrC2oTNkSUFYi+tAmg/OOarW6mgCeef6NBl7P6xmCf7+rfk3QJzQtTTiYOpKmdBCzbf4qTPiVc7UbouzOpdPpJb6NBAkS/N/4CYEq0aMTUsBvAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAAAYCAYAAABOQSt5AAAED0lEQVR4Xu1XTWhTQRB+QYX6gz9oiW3TbBKqUFAUgkpFDxYPonipBwsRPImXgiCo6MmDRURQMMVDWxCFokgtihSKePAPEetFoQqCB0UUFC2IFdrS6vfl7SaTyXtpUUSE98FH3puZnZ2dnZ238bwIESL8K2Sz2XnpdDqeSqVqtO53QH/JZPIAyWet/2MYY7aBn8GfJCYaSiQS852+qalpMRZzx+ktB+Lx+ELpx6G+vn4F7J9au29IxjqhWwD/15QvspN66LbjeVrIp+Brv9Vl8T4GjiK+tYwLz7eVnynwlJvPjtunbB43NDQslzYSMRh0gxPgONiiDSBrA/tlkqqA/vrAYQSyTCszmcwS6J4Yf9E7pY47DtldMC3leG8Gv4BvwTonZ9Xh/RU4ibFb5BgLxpIHLzJ5WlkGBovMX8bvIeNnrQvimLSB7DCYk7Iw0J/xk3DJU34coO/Qc2FRG/F+nYlS5rSvM34S3nDxStdJX1jDSSm3uj1gflbHieWLoM/byZjd96Z8R+bivUeWeTW4MkZgB7XOgf7tPIW5mAQeS5RtQtsSPHKwGwHv1dbWLpI6yFqMX8llFWiPWmBiAwHjnAuaWTX+TnU4vT33rJiKMnfgLkG/G5OutudyjAnRdgIs2S7OxU2A/1vwYbSRAxfPJICDugGLo1Y8Hra6HlXzWQEMOOeCbmxsXIP3UTp2maRzvOfLR/lg0+QRMH7jyoE3wK/gCBOo7SWs30njV88mrVdgVfZzQ7SCEBt4gYsHBsFmbRcK7jKdi6A54VVwGvIdFLBauEgxrACeO8i7oX/gkoZmugqyT0yOF9IfHDBuJfjahDRoDcZp7BdGwx1H8AOe77MitE1VuP7giaCZACaCCeFXwoT0B9i124S1O5kLiMmTthqsJNj1MmgT0qA1YHMC9se0nBBHh/Hs1foZYUR/cBBnjkeklTvBypE2kNUYv/w+QpdxcvpjItxRC4KtpDwD5lgjmqa2lWASYNOm5QTjg27YzOJIBqHwjUVf2KAVydJF5CUCPqP1pvQ5k80rxiMxQzCc8wjJZ/teaJpGNOggcB4xVxlM6Z7R581QWRUI6A9FpEsXFQZY0R9MKRG9TiZ2pY/PPHLqEuOScFZ+103p81ds0EFArEtJLScYI2PV1T0rYGArOMCrr9YRKb8TM8sV3Ze9AwsdYgV4dmfxfJTB2BJuwe9pZ8+eAH/HIR/U13ORwHFU51apc2AMNpagI+Qq8UdQdYci6V80vjNoS+7GLm3HT6ldbOD9AQtbD77A2CvWjjfTXvAZnm+iqgzvFSn/y+DmInswfA598H+D8RdX1GPsO/xulnPxogXZc/Chqwr76eZ/F7mWCcp0sv86Av5lxvinJuwsR4gQIUKECP8nfgG4Z1712pHORwAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAXCAYAAAAcP/9qAAABEElEQVR4XmNgGAWjgHLALCcnF6YABOgSVAcyMjKcQMt8gXZNlJeXfwrEX4F8Y3R1DEAFHCCMLk4uAFkMtMwTaKYD0MJ6nBYDBZWAkruBCjulpaWF0eUpAUCzy3FaDAWMioqKekBF24F4LhAroisgBxBjMRwAHaAOVLwahEFsdHlSAEkWwwDI1yDfA6PgEBCbA4UY0dUQAmRZDANAjZJAPJUcB1BkMQiAEh1Q83SgIUdIyZNkWwz17RQg3k+qb0GAZIuh8TsbiLeAUjsDiRbCALEWUz1LQS3+Jisra4ouBwKMoGAEBSc0WCXRFZACxMXFuYEWrgCa8w6I/yPhZ0DcB1cI5HgCFbZTu9QaBaNgQAAAzCFNSReGP5oAAAAASUVORK5CYII=>
