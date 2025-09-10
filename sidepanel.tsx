import { UploadOutlined } from "@ant-design/icons"
import {
  Button,
  Col,
  Divider,
  Input,
  message,
  Row,
  Select,
  Typography,
  Upload,
  type UploadProps
} from "antd"
import JSON5 from "json5"
import * as R from "ramda"
import { useEffect, useState } from "react"

const { Text } = Typography

function IndexSidePanel() {
  const [currentName, setCurrentName] = useState("")
  const [routeOption, setRouteOption] = useState([])
  const [currentPath, setCurrentPath] = useState("")
  const [currentParam, setCurrentParam] = useState("")
  const [currentSaved, setCurrentSaved] = useState("")
  const [savedRouteOption, setSavedRouteOption] = useState([])

  useEffect(() => {
    const pages = localStorage.getItem("chrome-pages")
    const saved = localStorage.getItem("chrome-saved")
    !!pages && setRouteOption(JSON.parse(pages))
    !!saved && setSavedRouteOption(JSON.parse(saved))
  }, [])

  const props: UploadProps = {
    beforeUpload(file: File) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const parsed = JSON5.parse(text)
          tranParsedData(parsed)
        } catch (err) {
          message.error("文件解析失败")
        }
      }

      reader.readAsText(file)
      return false
    },
    style: { marginBottom: 16 },
    showUploadList: false
  }

  const tranParsedData = (parsed) => {
    let result = []
    const pagesRoute = parsed.pages.map((v) => {
      return { label: v.path, value: v.path }
    })

    const tabbarRoute = parsed.tabBar.list.map((v) => {
      return { label: v.pagePath, value: v.pagePath }
    })

    const subPackagesRoute = R.unnest(
      parsed.subPackages.map((v) => {
        return v.pages.map((j) => `${v.root}/${j.path}`)
      })
    ).map((v) => ({ label: v, value: v }))
    result = [...tabbarRoute, ...pagesRoute, ...subPackagesRoute]

    const uniqResult = R.uniqBy(R.prop("value"), result)
    localStorage.setItem("chrome-pages", JSON.stringify(uniqResult))

    setRouteOption(uniqResult)

    message.success("文件解析成功")
  }

  const handleSelectChange = (path) => {
    setCurrentSaved("")
    setCurrentPath(path)
  }

  const handleParamChange = (e) => {
    setCurrentParam(e.target.value)
  }

  const handleNameChange = (e) => {
    setCurrentName(e.target.value)
  }

  const updateTabUrl = () => {
    const url = `http://localhost:8080/#/${currentPath}?${currentParam}`
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      chrome.tabs.update(tab.id, { url })
      message.success("跳转成功")
    })
  }

  const saveRoutes = () => {
    const url = `http://localhost:8080/#/${currentPath}?${currentParam}`
    const currentSave = { label: currentName || currentPath, value: url }
    setSavedRouteOption([...savedRouteOption, currentSave])
    localStorage.setItem(
      "chrome-saved",
      JSON.stringify([...savedRouteOption, currentSave])
    )
    setCurrentName("")
    message.success("保存成功")
  }

  const handleSavedChange = (url) => {
    setCurrentSaved(url)
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      chrome.tabs.update(tab.id, { url })
    })
  }

  const clearSavedOption = () => {
    setSavedRouteOption([])
    localStorage.removeItem("chrome-saved")
    message.success("清除成功")
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <Upload {...props}>
        <Button type="primary" icon={<UploadOutlined />}>
          {routeOption?.length > 0
            ? "pages.json文件已上传，点击重新上传文件"
            : "请上传pages.json文件"}
        </Button>
      </Upload>

      <Text>名字：</Text>
      <Input
        placeholder="请输入保存时的别名"
        allowClear
        onChange={handleNameChange}
        style={{ width: 400, marginBottom: 16 }}
        value={currentName}
      />

      <Text>路由：</Text>
      <Select
        showSearch
        placeholder="请选择需要跳转的路由"
        optionFilterProp="label"
        onChange={handleSelectChange}
        options={routeOption}
        style={{ width: 400, marginBottom: 16 }}
      />

      <Text>参数：</Text>
      <Input
        placeholder="请输入需要携带的参数"
        allowClear
        onChange={handleParamChange}
        style={{ width: 400, marginBottom: 16 }}
      />

      <Row gutter={24}>
        <Col>
          <Button type="primary" onClick={updateTabUrl} style={{ width: 80 }}>
            跳转
          </Button>
        </Col>

        <Col>
          <Button type="primary" onClick={saveRoutes} style={{ width: 80 }}>
            保存
          </Button>
        </Col>

        <Col>
          <Button color="danger" variant="solid" onClick={clearSavedOption}>
            一键清除已保存路由
          </Button>
        </Col>
      </Row>

      <Text style={{ marginTop: 16 }}>已保存的路由：</Text>
      <Select
        showSearch
        allowClear
        placeholder="请选择已保存的路由"
        optionFilterProp="label"
        onChange={handleSavedChange}
        options={savedRouteOption}
        style={{ width: 400 }}
        value={currentSaved}
      />
    </div>
  )
}

export default IndexSidePanel
