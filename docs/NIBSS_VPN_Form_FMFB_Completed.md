# NIBSS VPN Setup Form - FirstMidas Microfinance Bank Limited

**Project Name:** NIBSS VPN Setup
**Date:** October 8, 2025

---

## EXTERNAL BUSINESS PARTNER (EBP)

### Company Information
- **EBP Company Name:** FirstMidas Microfinance Bank Limited (FMFB) / OrokiiPay Platform
- **Address:** [To be provided by FMFB]
- **City:** Lagos
- **State:** Lagos
- **Country:** Nigeria

### First Level Contact
- **Name:** [To be provided by FMFB]
- **Phone:** [To be provided]
- **Pager/Cell:** [To be provided]
- **Internet Email Address:** [To be provided]

### Technical Contact
- **Name:** OrokiiPay Development Team
- **Phone:** [To be provided]
- **Pager/Cell:** [To be provided]
- **Internet Email Address:** support@orokiipay.com

### After Hours Contact
- **Name:** OrokiiPay Technical Support
- **Phone:** [To be provided]
- **Pager/Cell:** [To be provided]
- **Internet Email Address:** support@orokiipay.com

---

## VPN PROFILE

### Partner VPN Information (FirstMidas/OrokiiPay)

| Parameter | Value |
|-----------|-------|
| **VPN Device** | Google Cloud Platform VPN (Cloud VPN Gateway) |
| **VPN Tunnel Endpoint IP Address** | 34.59.143.25 |
| **IKE VERSION** | 2 |
| **VPN PEER behind NAT** | No |
| **IKE Encryption** | AES-256 (to match NIBSS) |
| **Authentication Method** | SHA-256 (to match NIBSS SHA) |
| **Diffie-Hellman Group** | Group 5 (1536-bit MODP) |
| **Security Association Lifetime** | 28800 seconds (8 hours - to match NIBSS) |
| **Pre-Shared Secret** | To be exchanged via PHONE CALL/Skype with NIBSS contact |

### NIBSS VPN Information (From NIBSS)

| Parameter | Value |
|-----------|-------|
| **VPN Device** | Cisco ASR 1000 Router |
| **VPN Tunnel Endpoint IP Address** | 196.6.103.25 |
| **IKE VERSION** | 1 or 2 |
| **VPN PEER behind NAT** | No |
| **IKE Encryption** | AES-256 |
| **Authentication Method** | SHA |
| **Diffie-Hellman Group** | 1, 2, or 5 |
| **Security Association Lifetime** | 28800 seconds |
| **Pre-Shared Secret** | Through PHONE CALL/Skype |

---

## IPSEC PARAMETERS

### Partner IPSEC Parameters (FirstMidas/OrokiiPay)

| Parameter | Value |
|-----------|-------|
| **IPSEC Encryption** | AES-256 (to match NIBSS) |
| **Authentication Method** | SHA-256 (to match NIBSS) |
| **Diffie-Hellman Group** | Group 5 (1536-bit MODP) |
| **Security Association Lifetime** | 1800 seconds (30 minutes - to match NIBSS) |
| **Perfect Forward Secrecy (PFS)** | Yes |
| **PFS Diffie-Hellman Group** | Group 5 |

### NIBSS IPSEC Parameters

| Parameter | Value |
|-----------|-------|
| **IPSEC Encryption** | AES-256 |
| **Authentication Method** | SHA |
| **Diffie-Hellman Group** | 1 or 2 |
| **Security Association Lifetime** | 1800 seconds |
| **Perfect Forward Secrecy (PFS)** | Yes/No |
| **PFS Diffie-Hellman Group** | 1, 2, or 5 |

---

## HOSTS

### Partner Host Information (FirstMidas/OrokiiPay)

**Primary Application Server:**
- IP Address: 34.59.143.25 (GCP Public IP)
- Purpose: NIBSS API Client - NIP Mini Service
- Operating System: Linux (Ubuntu/Debian on GCP)
- Platform: Google Cloud Platform
- Region: us-central1 (or applicable GCP region)

**Internal Network (if applicable):**
- Internal IP: 10.x.x.x (GCP internal network)
- Subnet: Managed by GCP VPC
- NAT Gateway: GCP Cloud NAT

**Note:** This is a cloud-based deployment on Google Cloud Platform. The external IP (34.59.143.25) is the egress IP for all NIBSS API communications.

### NIBSS Host Information

**NIBSS Host IP:** 196.6.103.10

---

## TECHNICAL SPECIFICATIONS

### Network Architecture
- **Cloud Provider:** Google Cloud Platform
- **VPN Type:** Cloud VPN (IPsec VPN)
- **Routing:** Route-based VPN with BGP (if supported) or Static routes
- **Bandwidth:** 1.5 Gbps (GCP Cloud VPN capacity)
- **Redundancy:** High availability configuration recommended

### Security Configuration
- **Encryption Standard:** AES-256 for both IKE and IPSEC
- **Hash Algorithm:** SHA-256
- **Key Exchange:** Diffie-Hellman Group 5 (1536-bit)
- **Perfect Forward Secrecy:** Enabled
- **Dead Peer Detection:** Enabled
- **IKE Lifetime:** 8 hours (28800 seconds)
- **IPSEC Lifetime:** 30 minutes (1800 seconds)

### Firewall Rules Required

**Outbound from FMFB/OrokiiPay (34.59.143.25):**
- Allow UDP 500 (IKE) to 196.6.103.25
- Allow UDP 4500 (NAT-T) to 196.6.103.25
- Allow IP Protocol 50 (ESP) to 196.6.103.25
- Allow IP Protocol 51 (AH) to 196.6.103.25

**Inbound to FMFB/OrokiiPay (34.59.143.25):**
- Allow UDP 500 (IKE) from 196.6.103.25
- Allow UDP 4500 (NAT-T) from 196.6.103.25
- Allow IP Protocol 50 (ESP) from 196.6.103.25
- Allow IP Protocol 51 (AH) from 196.6.103.25

**Application Traffic:**
- Allow HTTPS (TCP 443) to/from NIBSS API servers
- Allow HTTP (TCP 80) to/from NIBSS API servers (if applicable)
- Destination: 196.6.103.10 and other NIBSS hosts

---

## CONTACT INFORMATION FOR VPN SETUP

### NIBSS Technical Contact
- **Name:** Eseoghene Charles-Adeoye
- **Department:** Network and Security
- **Email:** eawe@nibss-plc.com.ng
- **Phone:** +234 802 874 0677
- **City/State:** Lagos, Lagos State

### FirstMidas/OrokiiPay Technical Contact
- **Name:** [To be provided by FMFB]
- **Department:** IT/Network Infrastructure
- **Email:** [To be provided]
- **Phone:** [To be provided]
- **Alternative Contact:** support@orokiipay.com

---

## PRE-SHARED SECRET EXCHANGE

**Security Protocol:**
The pre-shared secret (PSK) for VPN authentication MUST be exchanged via secure channels only:

1. **Primary Method:** Phone call with NIBSS contact (Eseoghene Charles-Adeoye: +234 802 874 0677)
2. **Alternative:** Skype/Teams call with video verification
3. **NOT via email** - PSK should never be sent via email for security reasons

**PSK Requirements:**
- Minimum 16 characters
- Case sensitive
- Should include uppercase, lowercase, numbers, and special characters
- Example format: `Ab3#Xy9@Mn5$Qw7&` (DO NOT use this example)

**Exchange Process:**
1. FMFB/OrokiiPay generates secure random PSK (16+ characters)
2. Schedule phone/Skype call with NIBSS technical contact
3. Verbally exchange PSK with verification (spell out character by character)
4. Both parties configure PSK in their respective VPN devices
5. Confirm PSK match before testing connection

---

## VPN TUNNEL CONFIGURATION SUMMARY

### Tunnel Parameters
| Setting | Value |
|---------|-------|
| **Tunnel Type** | IPsec Site-to-Site VPN |
| **Local Endpoint (FMFB)** | 34.59.143.25 |
| **Remote Endpoint (NIBSS)** | 196.6.103.25 |
| **IKE Version** | IKEv2 (preferred) or IKEv1 |
| **Phase 1 Encryption** | AES-256 |
| **Phase 1 Hash** | SHA-256 |
| **Phase 1 DH Group** | Group 5 |
| **Phase 1 Lifetime** | 28800 seconds (8 hours) |
| **Phase 2 Encryption** | AES-256 |
| **Phase 2 Hash** | SHA-256 |
| **Phase 2 DH Group** | Group 5 (with PFS) |
| **Phase 2 Lifetime** | 1800 seconds (30 minutes) |
| **Perfect Forward Secrecy** | Enabled |
| **Dead Peer Detection** | Enabled (30 sec interval, 3 retries) |

### Route Configuration
- **Local Network:** 34.59.143.25/32 (single host)
- **Remote Network:** 196.6.103.0/24 (NIBSS network)
- **Routing Protocol:** Static routes or BGP
- **Traffic Selector:** 34.59.143.25 ↔ 196.6.103.10

---

## TESTING CHECKLIST

After VPN setup, verify the following:

- [ ] VPN tunnel establishes successfully
- [ ] Phase 1 (IKE) negotiation completes
- [ ] Phase 2 (IPSEC) negotiation completes
- [ ] Can ping 196.6.103.10 from 34.59.143.25
- [ ] Can reach NIBSS API endpoints via HTTPS
- [ ] No packet drops or errors in tunnel
- [ ] DPD (Dead Peer Detection) working
- [ ] Tunnel auto-reconnects after failure
- [ ] Logs show successful SA establishment
- [ ] Application traffic flows through tunnel

### Test Commands
```bash
# Ping NIBSS host through tunnel
ping 196.6.103.10 -c 5

# Test HTTPS connectivity
curl -v https://apitest.nibss-plc.com.ng/health

# Check VPN tunnel status (GCP)
gcloud compute vpn-tunnels describe [TUNNEL_NAME]

# Monitor VPN logs
gcloud logging read "resource.type=vpn_gateway" --limit 50
```

---

## ADDITIONAL NOTES

### Cloud-Specific Considerations

**Google Cloud VPN Configuration:**
1. Create VPN Gateway in GCP console
2. Create External VPN Gateway (for NIBSS endpoint: 196.6.103.25)
3. Create VPN Tunnel with IPsec parameters above
4. Configure Cloud Router (if using BGP) or static routes
5. Set up firewall rules for VPN traffic
6. Configure health check monitoring

**High Availability:**
- Consider setting up redundant VPN tunnel
- Use Cloud VPN HA (High Availability) configuration
- Configure multiple tunnels to NIBSS if supported
- Implement automatic failover

### Monitoring & Maintenance
- Enable VPN tunnel monitoring in GCP
- Set up alerts for tunnel down events
- Monitor bandwidth utilization
- Regular testing of failover scenarios
- Periodic security audits of VPN configuration

### Documentation Requirements
- Document PSK securely (encrypted password manager)
- Maintain VPN configuration backups
- Document troubleshooting procedures
- Keep contact list updated
- Schedule regular VPN testing (monthly)

---

## APPROVAL & SIGN-OFF

### FirstMidas Microfinance Bank / OrokiiPay

**Prepared By:** OrokiiPay Development Team
**Date:** October 8, 2025
**Signature:** _______________________

**Approved By:** [FMFB IT Manager/Network Admin]
**Date:** _______________________
**Signature:** _______________________

### NIBSS

**Received By:** Eseoghene Charles-Adeoye
**Department:** Network and Security
**Date:** _______________________
**Signature:** _______________________

**Approved By:** [NIBSS Network Manager]
**Date:** _______________________
**Signature:** _______________________

---

## APPENDIX: GCP VPN SETUP COMMANDS

### Example GCP VPN Configuration (for reference)

```bash
# Create VPN Gateway
gcloud compute vpn-gateways create fmfb-nibss-vpn-gateway \
    --network=orokiipay-vpc \
    --region=us-central1

# Create External VPN Gateway (NIBSS)
gcloud compute external-vpn-gateways create nibss-gateway \
    --interfaces=0=196.6.103.25

# Create VPN Tunnel
gcloud compute vpn-tunnels create fmfb-nibss-tunnel \
    --peer-external-gateway=nibss-gateway \
    --peer-external-gateway-interface=0 \
    --region=us-central1 \
    --ike-version=2 \
    --shared-secret=[PSK_FROM_PHONE_CALL] \
    --router=fmfb-cloud-router \
    --vpn-gateway=fmfb-nibss-vpn-gateway \
    --interface=0

# Create Firewall Rules
gcloud compute firewall-rules create allow-nibss-vpn \
    --network=orokiipay-vpc \
    --allow=udp:500,udp:4500,esp,ah \
    --source-ranges=196.6.103.0/24
```

---

**Document Version:** 1.0
**Last Updated:** October 8, 2025
**Next Review:** After VPN tunnel establishment
**Status:** Pending FMFB contact information and PSK exchange